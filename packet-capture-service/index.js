import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { lookupGeoIP, checkThreatIntel } from './geoip.js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const NETWORK_INTERFACE = process.env.NETWORK_INTERFACE || 'any';
const MAX_PACKETS_PER_BATCH = parseInt(process.env.MAX_PACKETS_PER_BATCH) || 10;

const packetBuffer = [];
let isProcessing = false;

console.log('🚀 ThreatWatch Packet Capture Service Starting...');
console.log(`📡 Monitoring interface: ${NETWORK_INTERFACE}`);
console.log(`🔗 Connected to Supabase: ${process.env.SUPABASE_URL}`);

function startPacketCapture() {
  const tsharkArgs = [
    '-i', NETWORK_INTERFACE,
    '-T', 'fields',
    '-e', 'frame.time_epoch',
    '-e', 'ip.src',
    '-e', 'ip.dst',
    '-e', 'tcp.srcport',
    '-e', 'tcp.dstport',
    '-e', 'udp.srcport',
    '-e', 'udp.dstport',
    '-e', 'ip.proto',
    '-e', 'frame.len',
    '-e', 'tcp.flags',
    '-E', 'separator=|',
    '-E', 'occurrence=f'
  ];

  if (process.env.CAPTURE_FILTER) {
    tsharkArgs.push('-f', process.env.CAPTURE_FILTER);
  }

  console.log('🎯 Starting tshark capture...');
  console.log(`Command: tshark ${tsharkArgs.join(' ')}`);

  const tshark = spawn('tshark', tsharkArgs);

  tshark.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());

    lines.forEach(line => {
      try {
        const packet = parsePacketLine(line);
        if (packet) {
          packetBuffer.push(packet);

          if (packetBuffer.length >= MAX_PACKETS_PER_BATCH && !isProcessing) {
            processPacketBatch();
          }
        }
      } catch (error) {
        console.error('Error parsing packet:', error.message);
      }
    });
  });

  tshark.stderr.on('data', (data) => {
    const message = data.toString();
    if (!message.includes('Capturing on')) {
      console.error('tshark error:', message);
    }
  });

  tshark.on('close', (code) => {
    console.log(`tshark process exited with code ${code}`);
    if (code !== 0) {
      console.log('Restarting capture in 5 seconds...');
      setTimeout(startPacketCapture, 5000);
    }
  });

  tshark.on('error', (error) => {
    console.error('Failed to start tshark:', error.message);
    console.log('\n❌ Make sure tshark is installed and you have permission to capture packets.');
    console.log('Run with sudo or as administrator.\n');
    process.exit(1);
  });

  setInterval(() => {
    if (packetBuffer.length > 0 && !isProcessing) {
      processPacketBatch();
    }
  }, 5000);
}

function parsePacketLine(line) {
  const fields = line.split('|');

  if (fields.length < 5) return null;

  const [timestamp, srcIP, dstIP, tcpSrcPort, tcpDstPort, udpSrcPort, udpDstPort, protocol, frameLen, tcpFlags] = fields;

  if (!srcIP || !dstIP || srcIP === '0.0.0.0' || dstIP === '0.0.0.0') {
    return null;
  }

  const sourcePort = parseInt(tcpSrcPort || udpSrcPort || 0);
  const destPort = parseInt(tcpDstPort || udpDstPort || 0);

  let protocolName = 'UNKNOWN';
  if (protocol) {
    const protoNum = parseInt(protocol);
    if (protoNum === 6) protocolName = 'TCP';
    else if (protoNum === 17) protocolName = 'UDP';
    else if (protoNum === 1) protocolName = 'ICMP';
  }

  if (destPort === 443 || destPort === 80) {
    protocolName = destPort === 443 ? 'HTTPS' : 'HTTP';
  } else if (destPort === 53) {
    protocolName = 'DNS';
  } else if (destPort === 22) {
    protocolName = 'SSH';
  } else if (destPort === 21) {
    protocolName = 'FTP';
  }

  return {
    source_ip: srcIP.trim(),
    dest_ip: dstIP.trim(),
    source_port: sourcePort,
    dest_port: destPort,
    protocol: protocolName,
    size: parseInt(frameLen || 0),
    tcp_flags: tcpFlags || null,
    captured_at: new Date(parseFloat(timestamp) * 1000).toISOString()
  };
}

async function processPacketBatch() {
  if (isProcessing || packetBuffer.length === 0) return;

  isProcessing = true;
  const batch = packetBuffer.splice(0, MAX_PACKETS_PER_BATCH);

  console.log(`📦 Processing batch of ${batch.length} packets...`);

  try {
    const enrichedPackets = await Promise.all(
      batch.map(async (packet) => {
        const geoData = await lookupGeoIP(packet.source_ip);
        const threatData = await checkThreatIntel(packet.source_ip);

        return {
          ...packet,
          country: geoData.country,
          country_code: geoData.countryCode,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          is_malicious: threatData.isMalicious,
          threat_type: threatData.threatType
        };
      })
    );

    const { data, error } = await supabase
      .from('packets')
      .insert(enrichedPackets);

    if (error) {
      console.error('❌ Error inserting packets:', error.message);
    } else {
      console.log(`✅ Inserted ${enrichedPackets.length} packets`);

      const maliciousCount = enrichedPackets.filter(p => p.is_malicious).length;
      if (maliciousCount > 0) {
        console.log(`🚨 Found ${maliciousCount} malicious packets!`);

        for (const packet of enrichedPackets.filter(p => p.is_malicious)) {
          await updateThreatRecord(packet);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error processing batch:', error.message);
  } finally {
    isProcessing = false;
  }
}

async function updateThreatRecord(packet) {
  try {
    const { data: existing } = await supabase
      .from('threats')
      .select('*')
      .eq('ip_address', packet.source_ip)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('threats')
        .update({
          last_seen: packet.captured_at,
          count: existing.count + 1
        })
        .eq('ip_address', packet.source_ip);
    } else {
      await supabase
        .from('threats')
        .insert([{
          ip_address: packet.source_ip,
          threat_types: [packet.threat_type],
          severity: determineSeverity(packet.threat_type),
          country: packet.country,
          country_code: packet.country_code,
          reports: ['ThreatWatch'],
          first_seen: packet.captured_at,
          last_seen: packet.captured_at,
          count: 1
        }]);
    }
  } catch (error) {
    console.error('Error updating threat record:', error.message);
  }
}

function determineSeverity(threatType) {
  if (!threatType) return 'low';

  const critical = ['APT', 'Botnet', 'Ransomware', 'C&C Server'];
  const high = ['Brute Force', 'Port Scanner', 'Phishing', 'Exploit Kit'];
  const medium = ['Suspicious', 'Known Malicious'];

  if (critical.includes(threatType)) return 'critical';
  if (high.includes(threatType)) return 'high';
  if (medium.includes(threatType)) return 'medium';
  return 'low';
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down packet capture service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down packet capture service...');
  process.exit(0);
});

startPacketCapture();
