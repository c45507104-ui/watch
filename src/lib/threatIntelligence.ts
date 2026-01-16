export interface ThreatData {
  ip: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  threatTypes: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  reports: string[];
}

export const maliciousIPs: ThreatData[] = [
  {
    ip: '185.220.101.1',
    country: 'Russia',
    countryCode: 'RU',
    latitude: 55.7558,
    longitude: 37.6173,
    threatTypes: ['Botnet', 'C&C Server'],
    severity: 'critical',
    reports: ['AbuseIPDB', 'AlienVault OTX', 'Cisco Talos']
  },
  {
    ip: '45.142.212.61',
    country: 'China',
    countryCode: 'CN',
    latitude: 39.9042,
    longitude: 116.4074,
    threatTypes: ['Port Scanner', 'Brute Force'],
    severity: 'high',
    reports: ['AbuseIPDB', 'VirusTotal', 'Shodan']
  },
  {
    ip: '103.75.201.2',
    country: 'North Korea',
    countryCode: 'KP',
    latitude: 39.0392,
    longitude: 125.7625,
    threatTypes: ['APT', 'Data Exfiltration'],
    severity: 'critical',
    reports: ['FireEye', 'CrowdStrike', 'Mandiant']
  },
  {
    ip: '91.219.236.197',
    country: 'Iran',
    countryCode: 'IR',
    latitude: 35.6892,
    longitude: 51.3890,
    threatTypes: ['Phishing', 'Credential Theft'],
    severity: 'high',
    reports: ['PhishTank', 'OpenPhish', 'AbuseIPDB']
  },
  {
    ip: '185.191.171.42',
    country: 'Romania',
    countryCode: 'RO',
    latitude: 44.4268,
    longitude: 26.1025,
    threatTypes: ['Ransomware', 'Malware Distribution'],
    severity: 'critical',
    reports: ['MalwareBazaar', 'URLhaus', 'VirusTotal']
  },
  {
    ip: '194.135.33.152',
    country: 'Netherlands',
    countryCode: 'NL',
    latitude: 52.3702,
    longitude: 4.8952,
    threatTypes: ['DDoS', 'Amplification Attack'],
    severity: 'medium',
    reports: ['Spamhaus', 'AbuseIPDB']
  },
  {
    ip: '167.88.61.60',
    country: 'United States',
    countryCode: 'US',
    latitude: 37.7749,
    longitude: -122.4194,
    threatTypes: ['Proxy Server', 'TOR Exit Node'],
    severity: 'medium',
    reports: ['TOR Project', 'ProxyCheck']
  },
  {
    ip: '46.17.174.172',
    country: 'Ukraine',
    countryCode: 'UA',
    latitude: 50.4501,
    longitude: 30.5234,
    threatTypes: ['Exploit Kit', 'Drive-by Download'],
    severity: 'high',
    reports: ['Malwarebytes', 'URLhaus', 'VirusTotal']
  },
  {
    ip: '89.248.165.178',
    country: 'Germany',
    countryCode: 'DE',
    latitude: 52.5200,
    longitude: 13.4050,
    threatTypes: ['Web Scanner', 'Vulnerability Probe'],
    severity: 'low',
    reports: ['Shodan', 'Censys']
  },
  {
    ip: '141.98.10.225',
    country: 'Turkey',
    countryCode: 'TR',
    latitude: 41.0082,
    longitude: 28.9784,
    threatTypes: ['Spam Relay', 'Email Abuse'],
    severity: 'medium',
    reports: ['Spamhaus', 'SpamCop']
  },
  {
    ip: '119.42.224.89',
    country: 'Vietnam',
    countryCode: 'VN',
    latitude: 21.0285,
    longitude: 105.8542,
    threatTypes: ['Cryptomining', 'Resource Hijacking'],
    severity: 'medium',
    reports: ['AbuseIPDB', 'BadPackets']
  },
  {
    ip: '195.201.152.24',
    country: 'Pakistan',
    countryCode: 'PK',
    latitude: 33.6844,
    longitude: 73.0479,
    threatTypes: ['SQL Injection', 'Web Attack'],
    severity: 'high',
    reports: ['AlienVault OTX', 'AbuseIPDB']
  }
];

export const legitCountries = [
  { name: 'United States', code: 'US', lat: 37.0902, lon: -95.7129 },
  { name: 'United Kingdom', code: 'GB', lat: 55.3781, lon: -3.4360 },
  { name: 'Canada', code: 'CA', lat: 56.1304, lon: -106.3468 },
  { name: 'France', code: 'FR', lat: 46.2276, lon: 2.2137 },
  { name: 'Japan', code: 'JP', lat: 36.2048, lon: 138.2529 },
  { name: 'Australia', code: 'AU', lat: -25.2744, lon: 133.7751 },
  { name: 'Brazil', code: 'BR', lat: -14.2350, lon: -51.9253 },
  { name: 'India', code: 'IN', lat: 20.5937, lon: 78.9629 },
  { name: 'South Korea', code: 'KR', lat: 35.9078, lon: 127.7669 },
  { name: 'Singapore', code: 'SG', lat: 1.3521, lon: 103.8198 }
];

export const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP'];

export const commonPorts = [80, 443, 22, 21, 25, 53, 3306, 5432, 8080, 8443];

export function generateRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function shouldBeMalicious(): boolean {
  return Math.random() < 0.15;
}
