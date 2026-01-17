import fetch from 'node-fetch';

const geoipCache = new Map();
const threatCache = new Map();

const CACHE_DURATION = 3600000;

const knownThreatIPs = new Set([
  '185.220.101.1',
  '45.142.212.61',
  '103.75.201.2',
  '91.219.236.197',
  '185.191.171.42',
  '194.135.33.152',
  '167.88.61.60',
  '46.17.174.172',
  '89.248.165.178',
  '141.98.10.225',
  '119.42.224.89',
  '195.201.152.24'
]);

const suspiciousPatterns = [
  { pattern: /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/, type: 'Private IP' },
  { pattern: /^(127\.|0\.|255\.)/, type: 'Loopback/Invalid' }
];

export async function lookupGeoIP(ip) {
  if (isPrivateIP(ip)) {
    return {
      country: 'Local Network',
      countryCode: 'LN',
      latitude: 0,
      longitude: 0
    };
  }

  const cached = geoipCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,lat,lon`, {
      timeout: 3000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'success') {
      const geoData = {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'XX',
        latitude: data.lat || 0,
        longitude: data.lon || 0
      };

      geoipCache.set(ip, { data: geoData, timestamp: Date.now() });
      return geoData;
    }
  } catch (error) {
    console.error(`GeoIP lookup failed for ${ip}:`, error.message);
  }

  return {
    country: 'Unknown',
    countryCode: 'XX',
    latitude: 0,
    longitude: 0
  };
}

export async function checkThreatIntel(ip) {
  const cached = threatCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  let isMalicious = false;
  let threatType = null;

  if (knownThreatIPs.has(ip)) {
    isMalicious = true;
    threatType = 'Known Malicious';
  }

  for (const { pattern, type } of suspiciousPatterns) {
    if (pattern.test(ip)) {
      threatType = type;
      break;
    }
  }

  try {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
      headers: {
        'Key': process.env.ABUSEIPDB_API_KEY || '',
        'Accept': 'application/json'
      },
      timeout: 3000
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json();
      if (data.data && data.data.abuseConfidenceScore > 75) {
        isMalicious = true;
        threatType = 'High Abuse Score';
      }
    }
  } catch (error) {
  }

  const threatData = { isMalicious, threatType };
  threatCache.set(ip, { data: threatData, timestamp: Date.now() });

  return threatData;
}

function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 127 ||
    parts[0] === 0
  );
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of geoipCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      geoipCache.delete(key);
    }
  }
  for (const [key, value] of threatCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      threatCache.delete(key);
    }
  }
}, 300000);
