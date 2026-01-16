import { supabase } from './supabase';
import {
  maliciousIPs,
  legitCountries,
  protocols,
  commonPorts,
  generateRandomIP,
  getRandomElement,
  shouldBeMalicious
} from './threatIntelligence';

export async function generatePacket() {
  const isMalicious = shouldBeMalicious();

  let sourceIP: string;
  let country: string;
  let countryCode: string;
  let latitude: number;
  let longitude: number;
  let threatType: string | null = null;
  let threatData;

  if (isMalicious) {
    threatData = getRandomElement(maliciousIPs);
    sourceIP = threatData.ip;
    country = threatData.country;
    countryCode = threatData.countryCode;
    latitude = threatData.latitude;
    longitude = threatData.longitude;
    threatType = getRandomElement(threatData.threatTypes);
  } else {
    const legitCountry = getRandomElement(legitCountries);
    sourceIP = generateRandomIP();
    country = legitCountry.name;
    countryCode = legitCountry.code;
    latitude = legitCountry.lat + (Math.random() - 0.5) * 10;
    longitude = legitCountry.lon + (Math.random() - 0.5) * 10;
  }

  const packet = {
    source_ip: sourceIP,
    dest_ip: generateRandomIP(),
    source_port: Math.floor(Math.random() * 65535),
    dest_port: getRandomElement(commonPorts),
    protocol: getRandomElement(protocols),
    size: Math.floor(Math.random() * 1500) + 64,
    is_malicious: isMalicious,
    threat_type: threatType,
    country,
    country_code: countryCode,
    latitude,
    longitude,
    captured_at: new Date().toISOString()
  };

  const { error } = await supabase.from('packets').insert([packet]);

  if (error) {
    console.error('Error inserting packet:', error);
  }

  if (isMalicious && threatData) {
    await updateThreatRecord(threatData);
  }

  return packet;
}

async function updateThreatRecord(threatData: typeof maliciousIPs[0]) {
  const { data: existing } = await supabase
    .from('threats')
    .select('*')
    .eq('ip_address', threatData.ip)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('threats')
      .update({
        last_seen: new Date().toISOString(),
        count: existing.count + 1
      })
      .eq('ip_address', threatData.ip);
  } else {
    await supabase.from('threats').insert([{
      ip_address: threatData.ip,
      threat_types: threatData.threatTypes,
      severity: threatData.severity,
      country: threatData.country,
      country_code: threatData.countryCode,
      reports: threatData.reports,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      count: 1
    }]);
  }
}

export async function updateAnalytics() {
  const { data: packets } = await supabase
    .from('packets')
    .select('is_malicious, country, threat_type');

  if (!packets) return;

  const totalPackets = packets.length;
  const maliciousPackets = packets.filter(p => p.is_malicious).length;

  const { data: threats } = await supabase.from('threats').select('ip_address');
  const uniqueThreats = threats?.length || 0;

  const countryCount = packets
    .filter(p => p.is_malicious && p.country)
    .reduce((acc, p) => {
      acc[p.country!] = (acc[p.country!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topCountries = Object.entries(countryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }));

  const threatCount = packets
    .filter(p => p.is_malicious && p.threat_type)
    .reduce((acc, p) => {
      acc[p.threat_type!] = (acc[p.threat_type!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topThreats = Object.entries(threatCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  await supabase.from('analytics').insert([{
    timestamp: new Date().toISOString(),
    total_packets: totalPackets,
    malicious_packets: maliciousPackets,
    unique_threats: uniqueThreats,
    top_countries: topCountries,
    top_threats: topThreats
  }]);
}
