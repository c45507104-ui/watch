import { useEffect, useState } from 'react';
import { Shield, Activity } from 'lucide-react';
import ThreatMap from './components/ThreatMap';
import StatsPanel from './components/StatsPanel';
import PacketFeed from './components/PacketFeed';
import ThreatFeed from './components/ThreatFeed';
import TopThreats from './components/TopThreats';
import ExportButton from './components/ExportButton';
import { generatePacket, updateAnalytics } from './lib/packetSimulator';

function App() {
  const [isActive, setIsActive] = useState(true);
  const [packetCount, setPacketCount] = useState(0);
  // Inside the App function, before the existing useEffect
useEffect(() => {
  const fetchInitialCount = async () => {
    // This asks Supabase for the total number of rows in the 'packets' table
    const { count } = await supabase
      .from('packets')
      .select('*', { count: 'exact', head: true });
    
    if (count !== null) setPacketCount(count);
  };

  fetchInitialCount();
}, []);
  useEffect(() => {
    if (!isActive) return;

    const generatePackets = async () => {
      await generatePacket();
      setPacketCount(prev => prev + 1);
    };

    const packetInterval = setInterval(generatePackets, 2000);

    const analyticsInterval = setInterval(updateAnalytics, 30000);

    return () => {
      clearInterval(packetInterval);
      clearInterval(analyticsInterval);
    };
  }, [isActive]);

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ThreatWatch SOC</h1>
                <p className="text-sm text-gray-400">Network Threat Intelligence Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-sm text-gray-300 font-medium">
                  {isActive ? 'LIVE MONITORING' : 'PAUSED'}
                </span>
              </div>

              <ExportButton />

              <button
                onClick={() => setIsActive(!isActive)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {isActive ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <ThreatMap />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <StatsPanel />
          </div>

          <div className="col-span-12">
            <TopThreats />
          </div>

          <div className="col-span-12 lg:col-span-7 h-[600px]">
            <PacketFeed />
          </div>

          <div className="col-span-12 lg:col-span-5 h-[600px]">
            <ThreatFeed />
          </div>
        </div>
      </main>
      <footer className="bg-gray-900 border-t border-gray-800 mt-12">
        <div className="flex items-center justify-between text-sm text-gray-500">
  <div className="flex items-center gap-2">
    <Activity className="w-4 h-4" />
    <span>Packets Captured: {packetCount.toLocaleString()}</span>
  </div>
  {/* This adds your name to the bottom right corner */}
  <div className="flex items-center gap-4">
    <span>ThreatWatch SOC v1.0</span>
    <span className="text-blue-400 font-medium">Made by Aastik</span>
  </div>
</div>
  <div className="max-w-[1920px] mx-auto px-6 py-4">
    <div className="flex items-center justify-between text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4" />
        <span>Packets Captured: {packetCount.toLocaleString()}</span>
      </div>
      {/* Add your name here */}
      <div className="flex items-center gap-4">
        <span>ThreatWatch SOC v1.0</span>
        <span className="text-blue-400 font-medium">Made by Aastik</span>
      </div>
    </div>
  </div>
</footer>

      
    </div>
  );
}

export default App;
