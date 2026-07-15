import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Box, 
  Bot, 
  FlaskConical, 
  Settings, 
  Bell, 
  BarChart3,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Sofa,
  Bed,
  Utensils,
  Bath,
  Wind,
  Tv,
  Lightbulb,
  Blinds,
  Fan,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  LocateFixed,
  Sparkles,
  Activity,
  Power
} from 'lucide-react';

// --- Custom CSS for Fonts, Grid, and Animations ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  body {
    font-family: 'Inter', sans-serif;
    background-color: #F7F9FC;
    margin: 0;
  }

  .premium-shadow {
    box-shadow: 0 8px 32px rgba(20, 40, 160, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02);
  }
  
  .glass-panel {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
  }

  .perspective-grid {
    background-size: 40px 40px;
    background-image: 
      linear-gradient(to right, rgba(33, 137, 255, 0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(33, 137, 255, 0.04) 1px, transparent 1px);
    transform: perspective(1000px) rotateX(60deg) translateY(-80px) scale(2.2);
    transform-origin: top center;
    pointer-events: none;
  }

  .animate-float {
    animation: float 7s ease-in-out infinite;
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
    100% { transform: translateY(0px); }
  }

  .node-pulse {
    animation: nodePulse 2.5s infinite;
  }

  @keyframes nodePulse {
    0% { box-shadow: 0 0 0 0 rgba(33, 137, 255, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(33, 137, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(33, 137, 255, 0); }
  }
`;

// --- Reusable Components ---
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 group
      ${active 
        ? 'bg-[#1428A0]/10 text-[#1428A0]' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
  >
    <Icon 
      size={22} 
      strokeWidth={active ? 2.5 : 2} 
      className={active ? 'text-[#1428A0]' : 'text-gray-400 group-hover:text-gray-600'} 
    />
    <span className="text-sm">{label}</span>
  </button>
);

const RoomCard = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-[18px] transition-all duration-300 shadow-sm outline-none
      ${active 
        ? 'bg-[#1428A0] text-white ring-4 ring-[#1428A0]/15 premium-shadow scale-[1.02]' 
        : 'bg-white text-gray-700 hover:bg-gray-50 hover:ring-2 hover:ring-gray-200 ring-1 ring-gray-100/80 active:scale-[0.98]'
      }`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0
      ${active ? 'bg-white/20' : 'bg-[#F7F9FC] text-[#1428A0]'}`}>
      <Icon size={22} strokeWidth={2.5} />
    </div>
    <span className="text-[15px] font-bold tracking-tight">{label}</span>
  </button>
);

const DeviceCard = ({ icon: Icon, name, status, power, consumption }) => (
  <div className="bg-white rounded-[22px] p-5 lg:p-6 premium-shadow ring-1 ring-gray-100/80 flex flex-col gap-5 group hover:ring-[#2189FF]/30 hover:shadow-lg transition-all duration-300">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-[14px] bg-[#F7F9FC] group-hover:bg-[#2189FF]/10 flex items-center justify-center transition-colors shrink-0">
          <Icon size={24} className="text-[#1428A0] group-hover:text-[#2189FF]" strokeWidth={2} />
        </div>
        <div>
          <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-1">{name}</h4>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${status === 'Online' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{status}</span>
          </div>
        </div>
      </div>
      
      {/* Power Toggle Mockup */}
      <div className={`w-12 h-6.5 rounded-full flex items-center px-1 transition-colors cursor-pointer mt-1 ${power === 'ON' ? 'bg-[#2189FF]' : 'bg-gray-200'}`} style={{ height: '26px' }}>
        <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-out ${power === 'ON' ? 'translate-x-[22px]' : 'translate-x-0'}`} style={{ width: '18px', height: '18px' }}></div>
      </div>
    </div>

    {consumption && (
      <div className="flex items-center justify-between pt-4 border-t border-gray-100/80 mt-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Today's Consumption</span>
        <span className="text-sm font-bold text-[#1428A0] bg-blue-50/50 px-2.5 py-1 rounded-md">{consumption}</span>
      </div>
    )}
  </div>
);

// --- Main Application ---
export default function App() {
  const [activeTab, setActiveTab] = useState('Digital Twin');
  const [activeRoom, setActiveRoom] = useState('Living Room');

  const sidebarMenu = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Upload Room Video', icon: Video },
    { label: 'Digital Twin', icon: Box },
    { label: 'AI Assistant', icon: Bot },
    { label: 'Automation Rules', icon: RefreshCw },
    { label: 'Analytics', icon: BarChart3 },
    { label: 'Simulation', icon: FlaskConical },
    { label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="flex h-screen w-full bg-[#F7F9FC] text-gray-900 overflow-hidden selection:bg-[#2189FF]/20">
        
        {/* --- SIDEBAR --- */}
        <aside className="hidden lg:flex w-[280px] bg-white border-r border-gray-200/60 flex-col shrink-0 z-30">
          <div className="h-24 px-8 flex items-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#1428A0] text-white flex items-center justify-center shadow-md">
                <Box size={18} strokeWidth={2.5} />
              </span>
              ASGUARD
            </h1>
          </div>
          
          <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
            {sidebarMenu.map((item) => (
              <SidebarItem 
                key={item.label}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.label}
                onClick={() => setActiveTab(item.label)}
              />
            ))}
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
          
          {/* Header */}
          <header className="h-24 px-10 flex items-center justify-between shrink-0 bg-[#F7F9FC]/90 backdrop-blur-md z-20">
            <div>
              <div className="flex items-center gap-4 mb-1.5">
                <h2 className="text-[26px] font-bold text-gray-900 tracking-tight">Interactive Digital Twin</h2>
                <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-widest flex items-center gap-1.5 shadow-sm mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  READY
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500">Interact with your reconstructed smart home.</p>
            </div>
            
            <div className="flex items-center gap-6">
              <button className="relative p-2.5 rounded-full text-gray-400 hover:text-[#1428A0] hover:bg-white hover:shadow-sm transition-all ring-1 ring-transparent hover:ring-gray-100">
                <Bell size={22} />
              </button>
              <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
              <div className="flex items-center gap-3.5 cursor-pointer group">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-[#1428A0] transition-colors">J. Doe</p>
                  <p className="text-xs font-semibold text-gray-500">Administrator</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
                  JD
                </div>
              </div>
            </div>
          </header>

          {/* Interactive Layout Content */}
          <div className="flex-1 flex gap-8 px-10 pb-10 overflow-hidden">
            
            {/* --- LEFT PANEL: Rooms --- */}
            <div className="w-[260px] flex flex-col shrink-0 h-full z-20">
              <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 ml-1">Select Room</h3>
              <div className="flex flex-col gap-4 overflow-y-auto pb-4 pr-3 scroll-smooth">
                <RoomCard icon={Sofa} label="Living Room" active={activeRoom === 'Living Room'} onClick={() => setActiveRoom('Living Room')} />
                <RoomCard icon={Bed} label="Bedroom" active={activeRoom === 'Bedroom'} onClick={() => setActiveRoom('Bedroom')} />
                <RoomCard icon={Utensils} label="Kitchen" active={activeRoom === 'Kitchen'} onClick={() => setActiveRoom('Kitchen')} />
                <RoomCard icon={Bath} label="Bathroom" active={activeRoom === 'Bathroom'} onClick={() => setActiveRoom('Bathroom')} />
              </div>
            </div>

            {/* --- CENTER: Large Interactive 3D Viewer --- */}
            <div className="flex-1 flex flex-col h-full gap-8 min-w-0 z-10">
              
              {/* 3D Viewer Container */}
              <div className="flex-1 bg-white rounded-[32px] premium-shadow ring-1 ring-gray-100/60 relative overflow-hidden flex flex-col group">
                
                {/* 3D Environment Background & Grid */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-[#E8F1FC]/25"></div>
                <div className="absolute inset-0 perspective-grid opacity-20"></div>
                
                {/* Simulated 3D Isometric Digital Twin */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-float">
                  <svg viewBox="0 0 800 600" className="w-[90%] h-[90%] max-w-[900px] drop-shadow-[0_20px_40px_rgba(20,40,160,0.15)] opacity-95">
                    <defs>
                      <linearGradient id="wallGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2189FF" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#1428A0" stopOpacity="0.18" />
                      </linearGradient>
                      <linearGradient id="floorGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#2189FF" stopOpacity="0.03" />
                        <stop offset="100%" stopColor="#1428A0" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>

                    {/* Floor */}
                    <path d="M400,480 L150,330 L400,180 L650,330 Z" fill="url(#floorGradient)" stroke="#2189FF" strokeWidth="2.5" strokeOpacity="0.4" />
                    {/* Left Wall */}
                    <path d="M150,330 L400,480 L400,220 L150,70 Z" fill="url(#wallGradient)" stroke="#1428A0" strokeWidth="2.5" strokeOpacity="0.4" />
                    {/* Right Wall */}
                    <path d="M400,480 L650,330 L650,70 L400,220 Z" fill="url(#wallGradient)" stroke="#1428A0" strokeWidth="2.5" strokeOpacity="0.4" />

                    {/* Isometric Grid Lines on Floor */}
                    <path d="M275,255 L525,405 M212,292 L462,442 M337,217 L587,367 M462,217 L212,367 M525,255 L275,405 M587,292 L337,442" stroke="#2189FF" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="6 6" />

                    {/* Simulated Furniture - Sofa (Wireframe + Fill) */}
                    <path d="M330,360 L450,432 L510,396 L390,324 Z" fill="white" fillOpacity="0.9" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M330,360 L330,320 L390,284 L390,324 Z" fill="white" fillOpacity="0.75" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M390,284 L510,356 L510,396 L390,324 Z" fill="white" fillOpacity="0.5" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />

                    {/* Simulated Device - TV (Left Wall) */}
                    <path d="M220,200 L350,278 L350,210 L220,132 Z" fill="#0f172a" stroke="#2189FF" strokeWidth="2.5" strokeLinejoin="round" />
                    {/* TV Screen Glow */}
                    <path d="M225,198 L345,270 L345,215 L225,143 Z" fill="#2189FF" fillOpacity="0.25" />
                    
                    {/* Simulated Device - AC (Right Wall) */}
                    <path d="M450,150 L580,72 L580,90 L450,168 Z" fill="white" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M450,168 L580,90 L580,100 L450,178 Z" fill="#e2e8f0" fillOpacity="0.8" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />

                    {/* Device Nodes (SmartThings Connection Points) */}
                    {/* TV Node */}
                    <circle cx="285" cy="205" r="7" fill="#2189FF" className="node-pulse" />
                    <line x1="285" y1="205" x2="285" y2="150" stroke="#2189FF" strokeWidth="1.5" strokeDasharray="4 4" />
                    
                    {/* AC Node */}
                    <circle cx="515" cy="120" r="7" fill="#2189FF" className="node-pulse" style={{ animationDelay: '0.5s' }} />
                    <line x1="515" y1="120" x2="515" y2="60" stroke="#2189FF" strokeWidth="1.5" strokeDasharray="4 4" />

                    {/* Smart Lighting Node (Ceiling Drop) */}
                    <circle cx="400" cy="260" r="7" fill="#2189FF" className="node-pulse" style={{ animationDelay: '1s' }} />
                    <line x1="400" y1="260" x2="400" y2="120" stroke="#2189FF" strokeWidth="2.5" />
                  </svg>
                </div>

                {/* Viewer Controls (Top Right Overlay) */}
                <div className="absolute top-8 right-8 glass-panel p-2.5 rounded-[20px] shadow-lg ring-1 ring-gray-900/5 flex flex-col gap-2 z-20 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#2189FF] text-gray-500 transition-colors shadow-sm hover:shadow relative">
                    <ZoomIn size={22} strokeWidth={2.5} />
                  </button>
                  <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#2189FF] text-gray-500 transition-colors shadow-sm hover:shadow">
                    <ZoomOut size={22} strokeWidth={2.5} />
                  </button>
                  <div className="w-8 h-[2px] bg-gray-200/80 mx-auto my-1.5 rounded-full"></div>
                  <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#1428A0] text-gray-500 transition-colors shadow-sm hover:shadow">
                    <RotateCcw size={22} strokeWidth={2.5} />
                  </button>
                  <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#1428A0] text-gray-500 transition-colors shadow-sm hover:shadow">
                    <LocateFixed size={22} strokeWidth={2.5} />
                  </button>
                  <div className="w-8 h-[2px] bg-gray-200/80 mx-auto my-1.5 rounded-full"></div>
                  <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#1428A0] text-gray-500 transition-colors shadow-sm hover:shadow">
                    <Maximize size={22} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Status Badges overlayed on Viewer */}
                <div className="absolute top-8 left-8 flex gap-3 z-20 pointer-events-none">
                  <div className="glass-panel px-4 py-2.5 rounded-xl text-sm font-bold text-[#1428A0] ring-1 ring-gray-900/5 shadow-sm flex items-center gap-2">
                    <Activity size={18} strokeWidth={2.5} />
                    Live Sync Active
                  </div>
                </div>

              </div>

              {/* Bottom Information Dashboard */}
              <div className="bg-white rounded-[28px] premium-shadow ring-1 ring-gray-100/60 p-7 flex items-center justify-between z-20 shrink-0">
                
                {/* Stats Row */}
                <div className="flex items-center gap-8 lg:gap-14 pl-2">
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Current Room</p>
                    <p className="text-[22px] font-bold text-gray-900 leading-none tracking-tight">{activeRoom}</p>
                  </div>
                  <div className="w-[1px] h-12 bg-gray-100"></div>
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Energy Score</p>
                    <p className="text-[22px] font-bold text-green-600 leading-none flex items-center gap-1.5 tracking-tight">
                      89<span className="text-base font-bold text-gray-400">/100</span>
                    </p>
                  </div>
                  <div className="w-[1px] h-12 bg-gray-100 hidden xl:block"></div>
                  <div className="hidden xl:block">
                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Current Usage</p>
                    <p className="text-[22px] font-bold text-gray-900 leading-none tracking-tight">2.4 kWh</p>
                  </div>
                  <div className="w-[1px] h-12 bg-gray-100"></div>
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Devices</p>
                    <p className="text-[22px] font-bold text-[#1428A0] leading-none tracking-tight">5</p>
                  </div>
                </div>

                {/* Actions (Clear Hierarchy) */}
                <div className="flex gap-4">
                  <button className="px-6 py-4 rounded-xl border-2 border-gray-100 bg-white text-gray-700 font-bold text-[15px] hover:bg-gray-50 hover:border-gray-200 hover:text-gray-900 transition-all active:scale-[0.98]">
                    View Analytics
                  </button>
                  <button className="px-7 py-4 rounded-xl bg-[#1428A0] text-white font-bold text-[15px] hover:bg-[#102080] transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.35)] active:scale-[0.98] flex items-center gap-2.5">
                    <FlaskConical size={18} strokeWidth={2.5} />
                    Run Simulation
                  </button>
                </div>
              </div>

            </div>

            {/* --- RIGHT PANEL: Devices --- */}
            <div className="w-[340px] flex flex-col shrink-0 h-full z-20">
              <div className="flex items-center justify-between mb-6 px-1.5">
                <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400">Connected Devices</h3>
                <span className="text-xs font-bold text-[#2189FF] bg-blue-50/80 ring-1 ring-blue-100/50 px-2.5 py-1 rounded-md shadow-sm">5 Online</span>
              </div>
              
              <div className="flex flex-col gap-4 overflow-y-auto pb-4 pr-3 scroll-smooth">
                <DeviceCard 
                  icon={Wind} 
                  name="Samsung WindFree AC" 
                  status="Online" 
                  power="ON" 
                  consumption="1.2 kWh"
                />
                <DeviceCard 
                  icon={Tv} 
                  name="Samsung Frame TV" 
                  status="Online" 
                  power="ON" 
                  consumption="0.8 kWh"
                />
                <DeviceCard 
                  icon={Lightbulb} 
                  name="Smart Lighting" 
                  status="Online" 
                  power="ON" 
                  consumption="0.3 kWh"
                />
                <DeviceCard 
                  icon={Blinds} 
                  name="Smart Curtains" 
                  status="Online" 
                  power="OFF" 
                />
                <DeviceCard 
                  icon={Fan} 
                  name="Ceiling Fan" 
                  status="Offline" 
                  power="OFF" 
                />
              </div>
            </div>

          </div>

          {/* Floating Action Button (Ask ASGUARD AI) */}
          <button className="absolute bottom-12 right-12 z-50 bg-gradient-to-r from-[#1428A0] to-[#2189FF] text-white pl-5 pr-6 py-4 rounded-full shadow-[0_8px_30px_rgba(33,137,255,0.4)] hover:shadow-[0_12px_40px_rgba(33,137,255,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 font-bold text-[15px] group ring-4 ring-white">
            <div className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
              <Sparkles size={20} className="text-white fill-white" />
            </div>
            Ask ASGUARD AI
          </button>

        </main>
      </div>
    </>
  );
}