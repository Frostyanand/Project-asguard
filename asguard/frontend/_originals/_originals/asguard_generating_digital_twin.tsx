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
  Loader2,
  Circle,
  Clock,
  Info,
  ChevronRight,
  FileVideo,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

// --- Custom CSS for Fonts and Animations ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  body {
    font-family: 'Inter', sans-serif;
    background-color: #F7F9FC;
    margin: 0;
  }

  .premium-shadow {
    box-shadow: 0 8px 40px rgba(20, 40, 160, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  /* Circular Progress Animation */
  .progress-ring__circle {
    transition: stroke-dashoffset 2s ease-out;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    stroke-dasharray: 440; /* 2 * pi * 70 */
    stroke-dashoffset: 123.2; /* 440 * (1 - 0.72) */
    animation: progressFill 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes progressFill {
    from { stroke-dashoffset: 440; }
    to { stroke-dashoffset: 123.2; }
  }

  /* Animated Dashed Line for Visualization */
  .animated-dashed-line {
    height: 2px;
    background-image: linear-gradient(to right, #2189FF 50%, transparent 50%);
    background-size: 14px 2px;
    background-repeat: repeat-x;
    animation: moveDashes 1.2s linear infinite;
  }

  @keyframes moveDashes {
    0% { background-position: 0 0; }
    100% { background-position: -14px 0; }
  }

  .pulse-glow {
    animation: pulseGlow 2.5s infinite;
  }

  @keyframes pulseGlow {
    0% { box-shadow: 0 0 0 0 rgba(33, 137, 255, 0.3); }
    70% { box-shadow: 0 0 0 14px rgba(33, 137, 255, 0); }
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

// --- Main Application ---
export default function App() {
  const [activeTab, setActiveTab] = useState('Digital Twin');

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

  const processingSteps = [
    { label: 'Video Uploaded', status: 'done' },
    { label: 'Frame Extraction', status: 'done' },
    { label: 'Feature Detection', status: 'done' },
    { label: 'Feature Matching', status: 'done' },
    { label: 'Camera Pose Estimation', status: 'active' },
    { label: 'Dense Point Cloud Generation', status: 'waiting' },
    { label: 'Mesh Reconstruction', status: 'waiting' },
    { label: 'Mesh Optimization', status: 'waiting' },
    { label: 'Preparing Digital Twin', status: 'waiting' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="flex h-screen w-full bg-[#F7F9FC] text-gray-900 overflow-hidden selection:bg-[#2189FF]/20">
        
        {/* --- SIDEBAR --- */}
        <aside className="hidden lg:flex w-[280px] bg-white border-r border-gray-200/60 flex-col shrink-0 z-20">
          <div className="h-24 px-8 flex items-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#1428A0] text-white flex items-center justify-center">
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

          <div className="p-6 border-t border-gray-100">
            <div className="bg-[#F7F9FC] rounded-2xl p-4 border border-gray-200/60 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <div>
                <p className="text-xs font-bold text-gray-900">Hub Online</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">All systems operational</p>
              </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Header */}
          <header className="h-24 px-6 lg:px-10 flex items-center justify-between shrink-0 bg-[#F7F9FC]/90 backdrop-blur-md z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                <LayoutDashboard size={24} />
              </button>
              <div>
                <h2 className="text-2xl lg:text-[26px] font-bold text-gray-900 tracking-tight">Generating Digital Twin</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">Your uploaded room video is being processed. This may take a few moments.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 lg:gap-6">
              <button className="relative p-2.5 rounded-full text-gray-400 hover:text-[#1428A0] hover:bg-white hover:shadow-sm transition-all">
                <Bell size={22} />
              </button>
              <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-[#1428A0] transition-colors">J. Doe</p>
                  <p className="text-xs font-semibold text-gray-500">Administrator</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
                  JD
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-16 scroll-smooth">
            <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8 pt-4">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                
                {/* LEFT COLUMN */}
                <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8 h-full">
                  
                  {/* Hero Progress Card */}
                  <div className="bg-white rounded-[24px] p-8 lg:p-12 premium-shadow ring-1 ring-gray-100/50 flex flex-col items-center justify-center relative overflow-hidden flex-1 min-h-[420px]">
                    
                    {/* Background Soft Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2189FF] rounded-full blur-[100px] opacity-[0.06] pointer-events-none"></div>

                    {/* Circular Progress SVG */}
                    <div className="relative w-64 h-64 lg:w-72 lg:h-72 mb-10">
                      <svg className="w-full h-full drop-shadow-xl" viewBox="0 0 160 160">
                        {/* Track */}
                        <circle 
                          cx="80" cy="80" r="70" 
                          fill="none" 
                          stroke="#F0F4F8" 
                          strokeWidth="8" 
                        />
                        {/* Progress */}
                        <circle 
                          className="progress-ring__circle"
                          cx="80" cy="80" r="70" 
                          fill="none" 
                          stroke="url(#blueGradient)" 
                          strokeWidth="8" 
                          strokeLinecap="round" 
                        />
                        <defs>
                          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1428A0" />
                            <stop offset="100%" stopColor="#2189FF" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* Inner Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-extrabold text-gray-900 tracking-tighter">72%</span>
                        <span className="text-xs font-bold tracking-widest uppercase text-[#2189FF] mt-2">Progress</span>
                      </div>
                    </div>

                    {/* Status Text */}
                    <div className="text-center z-10">
                      <h3 className="text-2xl lg:text-[26px] font-bold text-gray-900 mb-4 tracking-tight flex items-center justify-center gap-3">
                        <Loader2 size={26} className="text-[#2189FF] animate-spin" />
                        Reconstructing 3D Environment...
                      </h3>
                      <div className="inline-flex items-center gap-2.5 bg-blue-50/80 border border-blue-100 text-[#1428A0] px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm">
                        <Clock size={16} strokeWidth={2.5} />
                        Estimated Remaining Time: <span className="font-bold">1 minute 20 seconds</span>
                      </div>
                    </div>
                  </div>

                  {/* Processing Visualization Card */}
                  <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                    <h4 className="text-[13px] font-bold tracking-widest uppercase text-gray-500 mb-10 ml-1">AI Reconstruction Pipeline</h4>
                    
                    {/* Pipeline Graphic Container */}
                    <div className="relative flex justify-between items-center px-2 sm:px-8">
                      
                      {/* Background connecting lines (Absolute for perfect alignment) */}
                      <div className="absolute left-10 right-10 top-[28px] h-[2px] bg-gray-100 z-0"></div>
                      <div className="absolute left-10 right-[50%] top-[28px] h-[2px] animated-dashed-line z-0"></div>

                      {/* Item 1: Video */}
                      <div className="flex flex-col items-center gap-4 relative z-10 bg-white px-3">
                        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[18px] bg-green-50 border border-green-100 flex items-center justify-center shadow-sm">
                          <FileVideo size={24} className="text-green-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Video</span>
                      </div>

                      {/* Item 2: AI Processing */}
                      <div className="flex flex-col items-center gap-4 relative z-10 bg-white px-3">
                        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[18px] bg-[#1428A0] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 pulse-glow relative">
                          <Cpu size={24} />
                        </div>
                        <span className="text-sm font-bold text-[#1428A0]">AI Reconstruction</span>
                      </div>

                      {/* Item 3: Wireframe */}
                      <div className="flex flex-col items-center gap-4 relative z-10 bg-white px-3 opacity-50">
                        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[18px] bg-gray-50 border border-gray-200 flex items-center justify-center">
                          <Layers size={24} className="text-gray-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-500">Wireframe</span>
                      </div>

                      {/* Item 4: Digital Twin */}
                      <div className="flex flex-col items-center gap-4 relative z-10 bg-white px-3 opacity-50">
                        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[18px] bg-gray-50 border border-gray-200 flex items-center justify-center">
                          <Sparkles size={24} className="text-gray-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-500">Digital Twin</span>
                      </div>

                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8 h-full">
                  
                  {/* Processing Pipeline Timeline */}
                  <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 flex-1">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-8">Processing Timeline</h3>
                    
                    <div className="relative pl-2 space-y-7">
                      {/* Vertical tracking line - Perfectly centered behind icons */}
                      <div className="absolute left-[23px] top-3 bottom-3 w-[2px] bg-gray-100 z-0"></div>
                      
                      {processingSteps.map((step, index) => (
                        <div key={index} className="relative flex items-start gap-5">
                          
                          {/* Status Icon Container */}
                          <div className="relative z-10 flex items-center justify-center w-[30px] h-[30px] bg-white rounded-full flex-shrink-0 mt-[-2px]">
                            {step.status === 'done' && (
                              <CheckCircle2 size={24} className="text-green-500 fill-green-50" />
                            )}
                            {step.status === 'active' && (
                              <div className="w-6 h-6 rounded-full border-2 border-[#2189FF] flex items-center justify-center relative bg-white">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#2189FF] animate-pulse"></div>
                                {/* Outer radar pulse */}
                                <div className="absolute inset-0 rounded-full border-2 border-[#2189FF] animate-ping opacity-25"></div>
                              </div>
                            )}
                            {step.status === 'waiting' && (
                              <Circle size={22} className="text-gray-200 fill-gray-50" />
                            )}
                          </div>
                          
                          {/* Label Content */}
                          <div className="pt-[1px]">
                            <p className={`text-sm font-bold ${
                              step.status === 'done' ? 'text-gray-900' :
                              step.status === 'active' ? 'text-[#1428A0]' : 'text-gray-400'
                            }`}>
                              {step.label}
                            </p>
                            {step.status === 'active' && (
                              <p className="text-xs font-semibold text-[#2189FF] mt-1.5">Currently Processing...</p>
                            )}
                            {step.status === 'waiting' && (
                              <p className="text-xs font-medium text-gray-400 mt-1.5">Waiting</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Information Card */}
                  <div className="bg-[#F0F4F8]/80 border border-blue-100/60 rounded-[24px] p-6 lg:p-8 flex gap-5 premium-shadow">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-full bg-blue-100/50 text-[#1428A0] flex items-center justify-center ring-4 ring-white shadow-sm">
                        <Info size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2 leading-tight">Processing is completely automatic.</h4>
                      <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                        Our AI reconstructs your room into a high-quality Digital Twin using advanced computer vision and photogrammetry.
                      </p>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Buttons */}
              <div className="pt-2 pb-6">
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
                  <button className="px-8 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98]">
                    Cancel
                  </button>
                  <button className="px-8 py-3.5 rounded-xl bg-white border border-[#2189FF]/30 text-[#1428A0] font-bold hover:bg-blue-50 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2">
                    Background Processing
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}