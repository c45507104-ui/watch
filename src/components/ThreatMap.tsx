import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase, Packet } from '../lib/supabase';

export default function ThreatMap() {
  const [threats, setThreats] = useState<Packet[]>([]);

  useEffect(() => {
    loadThreats();

    const subscription = supabase
      .channel('packet-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'packets',
        filter: 'is_malicious=eq.true'
      }, (payload) => {
        setThreats(prev => [payload.new as Packet, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadThreats = async () => {
    const { data } = await supabase
      .from('packets')
      .select('*')
      .eq('is_malicious', true)
      .order('captured_at', { ascending: false })
      .limit(50);

    if (data) setThreats(data);
  };

  const getPositionFromCoords = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        Global Threat Map
      </h2>

      <div className="relative w-full h-96 bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <image href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 500'%3E%3Cpath fill='%23334155' d='M0,0 L1000,0 L1000,500 L0,500 Z'/%3E%3Cpath fill='%23475569' d='M150,150 L200,100 L250,120 L280,100 L320,130 L300,180 L250,200 L200,180 Z M400,200 L450,180 L500,200 L480,250 L430,260 Z M600,150 L680,140 L720,180 L700,240 L650,250 L620,220 Z M100,300 L180,280 L220,320 L200,380 L150,400 L120,360 Z M750,80 L850,70 L900,120 L880,180 L820,200 L770,160 Z'/%3E%3C/svg%3E" x="0" y="0" width="100" height="50" />

          {threats.map((threat, idx) => {
            if (!threat.latitude || !threat.longitude) return null;
            const pos = getPositionFromCoords(threat.latitude, threat.longitude);

            return (
              <g key={threat.id || idx}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="0.8"
                  fill="#ef4444"
                  opacity="0.6"
                  className="animate-pulse"
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="1.5"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="0.2"
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    from="1.5"
                    to="3"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-2 right-2 bg-gray-950/80 px-3 py-1 rounded text-xs text-gray-400 border border-gray-700">
          {threats.length} active threats
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-950 rounded p-3 border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Critical Threats</div>
          <div className="text-2xl font-bold text-red-500">
            {threats.filter(t => t.threat_type && ['APT', 'Botnet', 'Ransomware'].includes(t.threat_type)).length}
          </div>
        </div>
        <div className="bg-gray-950 rounded p-3 border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Countries Affected</div>
          <div className="text-2xl font-bold text-orange-500">
            {new Set(threats.map(t => t.country_code).filter(Boolean)).size}
          </div>
        </div>
      </div>
    </div>
  );
}
