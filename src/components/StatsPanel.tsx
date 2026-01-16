import { useEffect, useState } from 'react';
import { Activity, Shield, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalPackets: number;
  maliciousPackets: number;
  threatRate: number;
  uniqueThreats: number;
}

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats>({
    totalPackets: 0,
    maliciousPackets: 0,
    threatRate: 0,
    uniqueThreats: 0
  });

  const [history, setHistory] = useState<number[]>(new Array(20).fill(0));

  useEffect(() => {
    updateStats();

    const interval = setInterval(updateStats, 5000);

    const subscription = supabase
      .channel('packet-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'packets'
      }, () => {
        updateStats();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const updateStats = async () => {
    const { data: packets } = await supabase
      .from('packets')
      .select('is_malicious');

    const { data: threats } = await supabase
      .from('threats')
      .select('id');

    if (packets) {
      const total = packets.length;
      const malicious = packets.filter(p => p.is_malicious).length;
      const rate = total > 0 ? (malicious / total) * 100 : 0;

      setStats({
        totalPackets: total,
        maliciousPackets: malicious,
        threatRate: rate,
        uniqueThreats: threats?.length || 0
      });

      setHistory(prev => [...prev.slice(1), malicious]);
    }
  };

  const maxHistory = Math.max(...history, 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 rounded-lg p-4 border border-blue-800/50">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.totalPackets.toLocaleString()}
          </div>
          <div className="text-sm text-blue-300">Total Packets</div>
        </div>

        <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-lg p-4 border border-red-800/50">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-xs text-red-300 font-semibold">ALERT</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.maliciousPackets.toLocaleString()}
          </div>
          <div className="text-sm text-red-300">Malicious Packets</div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/40 to-orange-950/40 rounded-lg p-4 border border-orange-800/50">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-orange-400" />
            <span className="text-xs text-orange-300 font-semibold">
              {stats.threatRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.uniqueThreats}
          </div>
          <div className="text-sm text-orange-300">Unique Threats</div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 rounded-lg p-4 border border-purple-800/50">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className={`text-xs font-semibold ${stats.threatRate > 10 ? 'text-red-400' : 'text-green-400'}`}>
              {stats.threatRate > 10 ? 'HIGH' : 'NORMAL'}
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats.threatRate.toFixed(1)}%
          </div>
          <div className="text-sm text-purple-300">Threat Rate</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Threat Activity (Real-time)</h3>
        <div className="flex items-end justify-between gap-1 h-24">
          {history.map((value, idx) => {
            const height = (value / maxHistory) * 100;
            return (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-red-500 to-red-600 rounded-t transition-all duration-300"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>-100s</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}
