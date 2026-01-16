import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Globe, Clock } from 'lucide-react';
import { supabase, Threat } from '../lib/supabase';

export default function ThreatFeed() {
  const [threats, setThreats] = useState<Threat[]>([]);

  useEffect(() => {
    loadThreats();

    const subscription = supabase
      .channel('threat-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'threats'
      }, () => {
        loadThreats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadThreats = async () => {
    const { data } = await supabase
      .from('threats')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(20);

    if (data) setThreats(data);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" />
          Threat Intelligence Feed
        </h2>
        <div className="text-sm text-gray-400 mt-1">
          Known malicious IPs and threat actors
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-800">
          {threats.map((threat) => (
            <div key={threat.id} className="p-4 hover:bg-gray-800/50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${getSeverityTextColor(threat.severity)}`} />
                  <div>
                    <div className="font-mono text-sm font-bold text-white mb-1">
                      {threat.ip_address}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {threat.country && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {threat.country}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {threat.count} detections
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getSeverityColor(threat.severity)}`}>
                    {threat.severity.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {threat.threat_types.map((type, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300"
                  >
                    {type}
                  </span>
                ))}
              </div>

              {threat.reports.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-semibold">Reported by:</span>{' '}
                  {threat.reports.join(', ')}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-600">
                Last seen: {new Date(threat.last_seen).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
