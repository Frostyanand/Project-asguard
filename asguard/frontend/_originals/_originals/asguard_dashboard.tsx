import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  Box, 
  Bot, 
  Activity, 
  FlaskConical, 
  Settings, 
  Bell, 
  Search,
  Thermometer, 
  Zap, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2,
  Home,
  Wifi,
  BarChart3,
  RefreshCw,
  Power
} from 'lucide-react';

// --- Custom CSS for Fonts and Chart Animations ---
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

  .chart-line {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawLine 2s ease-out forwards;
  }
  
  .chart-fill {
    animation: fadeIn 2.5s ease-out forwards;
  }

  @keyframes drawLine {
    to { stroke-dashoffset: 0; }
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  .pulse-ring {
    animation: pulseRing 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulseRing {
    0% { transform: scale(0.8); opacity: 0.5; }
    100% { transform: scale(2.5); opacity: 0; }
  }
`;

// --- Components ---

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

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, bgClass }) => (
  <div className="bg-white rounded-[24px] p-6 lg:p-8 premium-shadow ring-1 ring-gray-100/50 flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bgClass}`}>
        <Icon size={24} className={colorClass} strokeWidth={2.5} />
      </div>
    </div>
    <div>
      <h4 className="text-3xl font-bold text-gray-900 tracking-tight mb-1.5">{value}</h4>
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
    </div>
  </div>
);

const QuickActionCard = ({ icon: Icon, label }) => (
  <button className="bg-white rounded-[24px] p-6 premium-shadow ring-1 ring-gray-100/50 hover:ring-[#2189FF]/30 hover:shadow-lg transition-all duration-300 group flex flex-col items-center justify-center gap-4 active:scale-[0.98] h-full">
    <div className="w-16 h-16 rounded-[20px] bg-[#F7F9FC] group-hover:bg-[#2189FF]/10 flex items-center justify-center transition-colors duration-300">
      <Icon size={28} className="text-[#1428A0] group-hover:text-[#2189FF] transition-colors" />
    </div>
    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 text-center leading-tight">{label}</span>
  </button>
);

// --- Main Dashboard ---
export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const sidebarMenu = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Scan Room', icon: Smartphone },
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
          <header className="h-24 px-6 lg:px-10 flex items-center justify-between shrink-0 bg-[#F7F9FC]/80 backdrop-blur-md z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                <LayoutDashboard size={24} />
              </button>
              <div>
                <h2 className="text-2xl lg:text-[26px] font-bold text-gray-900 tracking-tight">Welcome Back</h2>
                <p className="text-sm font-medium text-gray-500">Home Overview</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 lg:gap-6">
              <button className="relative p-2.5 rounded-full text-gray-400 hover:text-[#1428A0] hover:bg-white hover:shadow-sm transition-all">
                <Bell size={22} />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-[#F7F9FC] rounded-full"></span>
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

          {/* Scrollable Dashboard Area */}
          <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-16 scroll-smooth">
            <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
              
              {/* Row 1: Hero & AI Rec */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                
                {/* Hero Card */}
                <div className="lg:col-span-8 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 relative overflow-hidden flex flex-col justify-between h-full min-h-[280px]">
                  {/* Decorative Background Element */}
                  <div className="absolute right-0 top-0 w-full md:w-[400px] h-full pointer-events-none opacity-40">
                    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full absolute right-[-10%] top-[-10%] scale-[1.3] text-[#2189FF]">
                       <path d="M100 20 L180 80 L180 170 L20 170 L20 80 Z" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="opacity-30" />
                       <path d="M100 30 L170 85 L170 160 L30 160 L30 85 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                       <path d="M30 85 L100 120 L170 85" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                       <path d="M100 120 L100 160" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-500">Digital Twin Status</h3>
                      <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        READY
                      </span>
                    </div>
                    
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">Your home has been successfully reconstructed.</h2>
                    <p className="text-gray-500 font-semibold flex items-center gap-2 mb-10">
                      <CheckCircle2 size={18} className="text-[#2189FF]" />
                      Last Scan: Today at 09:41 AM
                    </p>
                    
                    <button className="bg-[#1428A0] hover:bg-[#102080] text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.3)] flex items-center gap-2 active:scale-[0.98] w-max">
                      Open Digital Twin
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Latest AI Recommendation */}
                <div className="lg:col-span-4 bg-gradient-to-br from-[#1428A0] to-[#1a36c4] rounded-[24px] p-8 lg:p-10 premium-shadow relative overflow-hidden text-white flex flex-col justify-between h-full">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#2189FF] rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/3"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                        <Bot size={22} className="text-white" />
                      </div>
                      <h3 className="text-sm font-bold tracking-widest uppercase text-blue-100">Latest Recommendation</h3>
                    </div>

                    <p className="text-xl lg:text-2xl font-medium leading-snug mb-8">
                      Increase AC temperature from <span className="font-bold text-[#2189FF] bg-white px-2 py-1 rounded-lg mx-1 shadow-sm">22°C</span> to <span className="font-bold text-[#2189FF] bg-white px-2 py-1 rounded-lg mx-1 shadow-sm">24°C</span>.
                    </p>

                    <div className="bg-black/20 rounded-[16px] p-5 mb-8 border border-white/10 flex items-center justify-between backdrop-blur-sm">
                      <span className="text-sm text-blue-100 font-semibold">Potential Saving</span>
                      <span className="text-3xl font-bold text-white flex items-center gap-1.5">
                        <Zap size={24} className="text-yellow-400 fill-yellow-400" />
                        10%
                      </span>
                    </div>
                  </div>

                  <button className="relative z-10 w-full bg-white text-[#1428A0] hover:bg-gray-50 font-bold text-base py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]">
                    View Recommendation
                  </button>
                </div>

              </div>

              {/* Row 2: Home Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
                <StatCard 
                  icon={Wifi} 
                  label="Connected Devices" 
                  value="14" 
                  subtext="SmartThings Hub Active"
                  colorClass="text-[#2189FF]"
                  bgClass="bg-[#2189FF]/10"
                />
                <StatCard 
                  icon={Power} 
                  label="Today's Energy Usage" 
                  value="12.4 kWh" 
                  subtext="-2.1% from yesterday"
                  colorClass="text-orange-500"
                  bgClass="bg-orange-50"
                />
                <StatCard 
                  icon={Settings} 
                  label="Automation Rules" 
                  value="8" 
                  subtext="Running perfectly"
                  colorClass="text-purple-500"
                  bgClass="bg-purple-50"
                />
                <StatCard 
                  icon={Activity} 
                  label="Efficiency Score" 
                  value="94/100" 
                  subtext="Excellent condition"
                  colorClass="text-green-500"
                  bgClass="bg-green-50"
                />
              </div>

              {/* Row 3: Quick Actions */}
              <div className="pt-2">
                <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-500 mb-5 ml-1">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 items-stretch">
                  <QuickActionCard icon={Smartphone} label="Scan Room" />
                  <QuickActionCard icon={Home} label="View Digital Twin" />
                  <QuickActionCard icon={Bot} label="AI Assistant" />
                  <QuickActionCard icon={BarChart3} label="Analytics" />
                  <QuickActionCard icon={FlaskConical} label="Simulation" />
                </div>
              </div>

              {/* Row 4: Chart & Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-2">
                
                {/* Clean Line Chart */}
                <div className="lg:col-span-8 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 flex flex-col h-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">Weekly Energy Usage</h3>
                      <p className="text-sm font-semibold text-gray-500 mt-1.5">Total consumption across all connected devices</p>
                    </div>
                    <select className="bg-white border border-gray-200/80 hover:bg-gray-50 text-sm font-bold text-gray-700 py-2.5 pl-4 pr-10 rounded-xl focus:ring-4 focus:ring-[#2189FF]/10 focus:border-[#2189FF] cursor-pointer outline-none appearance-none transition-all shadow-sm shrink-0">
                      <option>This Week</option>
                      <option>Last Week</option>
                    </select>
                  </div>

                  {/* SVG Chart Construction */}
                  <div className="relative flex-1 w-full min-h-[240px] pt-2">
                    {/* Y-Axis Labels */}
                    <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[12px] font-bold text-gray-400 w-10">
                      <span>30k</span>
                      <span>20k</span>
                      <span>10k</span>
                      <span>0</span>
                    </div>

                    {/* Chart Graphic */}
                    <div className="absolute left-14 right-2 top-2 bottom-8">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between">
                        <div className="w-full border-b border-gray-100"></div>
                        <div className="w-full border-b border-gray-100"></div>
                        <div className="w-full border-b border-gray-100"></div>
                        <div className="w-full border-b border-gray-200"></div>
                      </div>

                      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2189FF" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#2189FF" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Fill Area */}
                        <path 
                          className="chart-fill"
                          d="M0,80 C15,60 25,75 40,40 C55,5 70,45 85,30 C95,20 100,10 100,10 L100,100 L0,100 Z" 
                          fill="url(#chartGradient)" 
                        />
                        {/* Line */}
                        <path 
                          className="chart-line"
                          d="M0,80 C15,60 25,75 40,40 C55,5 70,45 85,30 C95,20 100,10 100,10" 
                          fill="none" 
                          stroke="#2189FF" 
                          strokeWidth="3.5" 
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Data Point Marker */}
                        <circle cx="85" cy="30" r="4" fill="#FFFFFF" stroke="#1428A0" strokeWidth="2.5" className="shadow-xl" />
                      </svg>
                    </div>

                    {/* X-Axis Labels */}
                    <div className="absolute left-14 right-2 bottom-0 flex justify-between text-[12px] font-bold text-gray-400">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="lg:col-span-4 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 h-full">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-8">Recent Activity</h3>
                  
                  <div className="relative pl-7 space-y-9">
                    {/* Timeline vertical line */}
                    <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-gray-100"></div>
                    
                    {/* Item 1 */}
                    <div className="relative">
                      <div className="absolute -left-7 top-0.5 w-7 h-7 rounded-full bg-blue-50 border-[3px] border-white shadow-sm flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#2189FF]"></div>
                      </div>
                      <p className="text-sm font-bold text-gray-900">AI Recommendation Generated</p>
                      <p className="text-xs font-semibold text-gray-500 mt-1.5">Just now</p>
                    </div>

                    {/* Item 2 */}
                    <div className="relative">
                      <div className="absolute -left-7 top-0.5 w-7 h-7 rounded-full bg-gray-100 border-[3px] border-white shadow-sm flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                      </div>
                      <p className="text-sm font-bold text-gray-700">Firebase Synced</p>
                      <p className="text-xs font-semibold text-gray-500 mt-1.5">10 mins ago</p>
                    </div>

                    {/* Item 3 */}
                    <div className="relative">
                      <div className="absolute -left-7 top-0.5 w-7 h-7 rounded-full bg-gray-100 border-[3px] border-white shadow-sm flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                      </div>
                      <p className="text-sm font-bold text-gray-700">Digital Twin Generated</p>
                      <p className="text-xs font-semibold text-gray-500 mt-1.5">Today, 09:45 AM</p>
                    </div>

                    {/* Item 4 */}
                    <div className="relative">
                      <div className="absolute -left-7 top-0.5 w-7 h-7 rounded-full bg-gray-100 border-[3px] border-white shadow-sm flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                      </div>
                      <p className="text-sm font-bold text-gray-700">Room Scan Completed</p>
                      <p className="text-xs font-semibold text-gray-500 mt-1.5">Today, 09:41 AM</p>
                    </div>

                  </div>
                </div>

              </div>
              
              {/* Bottom Spacing */}
              <div className="h-6"></div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}