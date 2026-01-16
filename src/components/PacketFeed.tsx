import { useEffect, useState } from 'react';
import { Network, AlertTriangle } from 'lucide-react';
import { supabase, Packet } from '../lib/supabase';

export default function PacketFeed() {
  const [packets, setPackets] = useState<Packet[]>([]);

  useEffect(() => {
    loadPackets();

    const subscription = supabase
      .channel('live-packets')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'packets'
      }, (payload) => {
        setPackets(prev => [payload.new as Packet, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPackets = async () => {
    const { data } = await supabase
      .from('packets')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(5000);

    if (data) setPackets(data);
  };

  const getSeverityColor = (threatType: string | null) => {
    if (!threatType) return 'text-green-400';
    const critical = ['APT', 'Botnet', 'Ransomware', 'C&C Server'];
    const high = ['Brute Force', 'Port Scanner', 'Phishing', 'Exploit Kit'];

    if (critical.includes(threatType)) return 'text-red-500';
    if (high.includes(threatType)) return 'text-orange-500';
    return 'text-yellow-500';
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-400" />
          Live Packet Capture
        </h2>
        <div className="text-sm text-gray-400 mt-1">
          Monitoring network traffic in real-time
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-800">
          {packets.map((packet) => (
            <div
              key={packet.id}
              className={`p-3 hover:bg-gray-800/50 transition-colors ${
                packet.is_malicious ? 'bg-red-950/20' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {packet.is_malicious && (
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className={`font-mono text-sm font-semibold ${getSeverityColor(packet.threat_type)}`}>
                      {packet.source_ip}
                    </span>
                    <span className="text-gray-600">→</span>
                    <span className="font-mono text-sm text-gray-400">{packet.dest_ip}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-mono">{packet.protocol}</span>
                    <span>:{packet.source_port} → :{packet.dest_port}</span>
                    <span>{packet.size} bytes</span>
                    {packet.country && (
                      <span className="flex items-center gap-1">
                        <span className="text-lg">{getFlagEmoji(packet.country_code || '')}</span>
                        {packet.country}
                      </span>
                    )}
                  </div>

                  {packet.is_malicious && packet.threat_type && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-red-950/50 border border-red-900/50 rounded text-xs text-red-300">
                      <span className="font-semibold">THREAT:</span>
                      {packet.threat_type}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-600 whitespace-nowrap">
                  {new Date(packet.captured_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏴';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
