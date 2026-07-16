'use client';

import { useSimulation } from '../context/SimulationContext';
import { Play, Pause, FastForward, Activity } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function SimulationPlayer() {
  const sim = useSimulation();
  const pathname = usePathname();

  if (pathname === '/ai-assistant') return null;
  if (!sim || sim.allLogs.length === 0 || sim.isLoading) return null;

  const {
    allLogs,
    virtualTime,
    setVirtualTime,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
  } = sim;

  const minTime = allLogs[0].timestamp;
  const maxTime = allLogs[allLogs.length - 1].timestamp;
  const progress = ((virtualTime - minTime) / (maxTime - minTime)) * 100;

  const dateObj = new Date(virtualTime);
  const dateStr = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const handleScrub = (e) => {
    const val = parseFloat(e.target.value);
    const newTime = minTime + ((maxTime - minTime) * (val / 100));
    setVirtualTime(newTime);
  };

  const speeds = [
    { label: '1 Hr / Sec', value: 3600 },
    { label: '1 Day / Sec', value: 86400 },
    { label: '1 Wk / Sec', value: 604800 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-[280px] bg-white border-t border-gray-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-50 px-6 py-4 flex flex-col gap-3 transition-all">
      
      {/* Scrubber */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-bold text-gray-400 w-12 text-right">START</span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="0.1"
          value={progress || 0} 
          onChange={handleScrub}
          className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2189FF]"
        />
        <span className="text-[10px] font-bold text-gray-400 w-12">END</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-[#1428A0] text-white flex items-center justify-center hover:bg-[#102080] transition-colors shadow-md active:scale-95"
          >
            {isPlaying ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} className="ml-1" />}
          </button>

          <div className="flex items-center gap-2 bg-[#F7F9FC] p-1.5 rounded-xl border border-gray-100">
            {speeds.map(s => (
              <button 
                key={s.value}
                onClick={() => setPlaybackSpeed(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${playbackSpeed === s.value ? 'bg-white text-[#2189FF] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right flex flex-col items-end">
            <span className="text-sm font-bold text-gray-900">{dateStr}</span>
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <Activity size={12} className={isPlaying ? "text-green-500 animate-pulse" : "text-gray-400"} />
              {timeStr}
            </span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
