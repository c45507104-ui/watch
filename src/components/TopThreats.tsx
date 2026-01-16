import { useEffect, useState } from 'react';
import { BarChart3, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CountryData {
  country: string;
  count: number;
}

interface ThreatTypeData {
  type: string;
  count: number;
}

export default function TopThreats() {
  const [topCountries, setTopCountries] = useState<CountryData[]>([]);
  const [topTypes, setTopTypes] = useState<ThreatTypeData[]>([]);

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateData = async () => {
    const { data: packets } = await supabase
      .from('packets')
      .select('country, threat_type, is_malicious')
      .eq('is_malicious', true);

    if (packets) {
      const countryCount = packets
        .filter(p => p.country)
        .reduce((acc, p) => {
          acc[p.country!] = (acc[p.country!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const countries = Object.entries(countryCount)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopCountries(countries);

      const typeCount = packets
        .filter(p => p.threat_type)
        .reduce((acc, p) => {
          acc[p.threat_type!] = (acc[p.threat_type!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const types = Object.entries(typeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopTypes(types);
    }
  };

  const maxCountryCount = Math.max(...topCountries.map(c => c.count), 1);
  const maxTypeCount = Math.max(...topTypes.map(t => t.count), 1);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          Top Threat Origins
        </h3>

        <div className="space-y-3">
          {topCountries.map((country, idx) => (
            <div key={country.country}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-300 font-medium">{country.country}</span>
                <span className="text-gray-400 font-mono">{country.count}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${(country.count / maxCountryCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-400" />
          Top Threat Types
        </h3>

        <div className="space-y-3">
          {topTypes.map((threat, idx) => (
            <div key={threat.type}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-300 font-medium">{threat.type}</span>
                <span className="text-gray-400 font-mono">{threat.count}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(threat.count / maxTypeCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
