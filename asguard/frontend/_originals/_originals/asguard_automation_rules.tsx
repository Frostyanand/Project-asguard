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
  Sparkles,
  Zap,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Lightbulb,
  Thermometer,
  Flame,
  Tv,
  Shirt,
  ArrowRight,
  ArrowDown,
  Edit3,
  Plus
} from 'lucide-react';

// --- Custom CSS for Fonts, Grids, and Animations ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  body {
    font-family: 'Inter', sans-serif;
    background-color: #F7F9FC;
    margin: 0;
  }

  .premium-shadow {
    box-shadow: 0 8px 32px rgba(20, 40, 160, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02);
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

const SummaryCard = ({ title, value, icon: Icon, iconColor, iconBg }) => (
  <div className="bg-white rounded-[24px] p-6 lg:p-8 premium-shadow ring-1 ring-gray-100/60 flex flex-col justify-between h-full group hover:ring-[#2189FF]/20 transition-all duration-300">
    <div className="flex justify-between items-start mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${iconBg}`}>
        <Icon size={24} className={iconColor} strokeWidth={2.5} />
      </div>
    </div>
    <div>
      <h4 className="text-[28px] lg:text-[32px] font-extrabold text-gray-900 tracking-tight leading-none mb-2.5">{value}</h4>
      <p className="text-[12px] font-bold tracking-widest uppercase text-gray-400">{title}</p>
    </div>
  </div>
);

const ToggleSwitch = ({ enabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    onClick={onChange}
    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2189FF] focus-visible:ring-offset-2 ${
      enabled ? 'bg-[#2189FF]' : 'bg-gray-200'
    }`}
  >
    <span className="sr-only">Toggle rule</span>
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const AutomationRuleCard = ({ rule }) => {
  const [enabled, setEnabled] = useState(rule.defaultEnabled);
  const Icon = rule.icon;

  return (
    <div className="bg-white rounded-[28px] p-7 lg:p-8 premium-shadow ring-1 ring-gray-100/80 flex flex-col h-full group hover:ring-[#2189FF]/30 hover:shadow-lg transition-all duration-300">
      
      {/* Card Header */}
      <div className="flex items-start justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4.5 pr-4">
          <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 ${enabled ? rule.iconBg : 'bg-gray-50 text-gray-400'} transition-colors duration-300`}>
            <Icon size={24} strokeWidth={2.5} className={enabled ? rule.iconColor : 'text-gray-400'} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-gray-900 leading-tight mb-2 tracking-tight">{rule.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${enabled ? 'bg-green-50 text-green-600 ring-1 ring-green-100/50' : 'bg-gray-100 text-gray-500'}`}>
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
        <div className="pt-1">
          <ToggleSwitch enabled={enabled} onChange={() => setEnabled(!enabled)} />
        </div>
      </div>

      {/* Logic Blocks (IF/THEN) - Automatically stretches to fill height */}
      <div className={`flex flex-col flex-1 mb-8 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-50 grayscale-[40%]'}`}>
        
        {/* IF Block */}
        <div className="bg-[#F7F9FC] rounded-[18px] p-5 lg:p-6 border border-gray-200/60 relative flex-1 flex items-center">
          <div className="absolute -top-3 left-6 bg-white border border-gray-200 px-3 py-0.5 rounded-full shadow-sm">
            <span className="text-[10px] font-extrabold text-gray-500 tracking-widest uppercase">IF</span>
          </div>
          <p className="text-[15px] font-semibold text-gray-700 leading-snug">{rule.ifText}</p>
        </div>

        {/* Visual Connector - Perfectly centered overlapping blocks */}
        <div className="-my-3 relative z-10 flex justify-center shrink-0">
          <div className="w-8 h-8 rounded-full bg-white border border-gray-100/80 shadow-sm flex items-center justify-center">
            <ArrowDown size={16} className="text-gray-400" strokeWidth={2.5} />
          </div>
        </div>

        {/* THEN Block */}
        <div className="bg-blue-50/50 rounded-[18px] p-5 lg:p-6 border border-blue-100/60 relative flex-1 flex items-center">
          <div className="absolute -top-3 left-6 bg-white border border-blue-100/80 px-3 py-0.5 rounded-full shadow-sm">
            <span className="text-[10px] font-extrabold text-[#1428A0] tracking-widest uppercase">THEN</span>
          </div>
          <p className="text-[15px] font-bold text-[#1428A0] leading-snug">{rule.thenText}</p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-5 border-t border-gray-100/80 shrink-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Estimated Saving</p>
          <p className="text-[16px] font-extrabold text-green-600 flex items-center gap-1.5 leading-none">
            <Zap size={16} className="fill-green-600" />
            {rule.saving}
          </p>
        </div>
        <button className="w-11 h-11 rounded-[14px] bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#2189FF] flex items-center justify-center transition-colors active:scale-[0.98]">
          <Edit3 size={18} strokeWidth={2.5} />
        </button>
      </div>

    </div>
  );
};

// --- Main Application ---
export default function App() {
  const [activeTab, setActiveTab] = useState('Automation Rules');

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

  const rulesData = [
    { 
      id: 1, 
      title: 'Smart Lighting', 
      icon: Lightbulb, 
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
      ifText: 'Room is empty for 10 minutes', 
      thenText: 'Turn OFF Lights', 
      saving: '6%', 
      defaultEnabled: true 
    },
    { 
      id: 2, 
      title: 'Smart AC', 
      icon: Thermometer, 
      iconBg: 'bg-blue-50',
      iconColor: 'text-[#2189FF]',
      ifText: 'Temperature exceeds 28°C', 
      thenText: 'Turn ON AC', 
      saving: '10%', 
      defaultEnabled: true 
    },
    { 
      id: 3, 
      title: 'Water Heater', 
      icon: Flame, 
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      ifText: 'Peak Hours (2 PM – 4 PM)', 
      thenText: 'Delay Heating', 
      saving: '8%', 
      defaultEnabled: true 
    },
    { 
      id: 4, 
      title: 'Smart TV', 
      icon: Tv, 
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
      ifText: 'No activity detected for 30 minutes', 
      thenText: 'Enter Sleep Mode', 
      saving: '5%', 
      defaultEnabled: true 
    },
    { 
      id: 5, 
      title: 'Washing Machine', 
      icon: Shirt, 
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-500',
      ifText: 'Peak Hours', 
      thenText: 'Schedule after 6 PM', 
      saving: '7%', 
      defaultEnabled: false 
    },
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
          <header className="h-24 px-6 lg:px-10 flex items-center justify-between shrink-0 bg-[#F7F9FC]/90 backdrop-blur-md z-20">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-[26px] font-bold text-gray-900 tracking-tight">Automation Rules</h2>
                <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg shadow-sm">
                  <RefreshCw size={16} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">Manage intelligent SmartThings automation policies to optimize household energy consumption.</p>
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

          {/* Scrollable Dashboard Area */}
          <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-12 scroll-smooth">
            <div className="max-w-[1500px] mx-auto pt-2 space-y-6 lg:space-y-8">
              
              {/* Summary Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
                <SummaryCard 
                  title="Active Rules" 
                  value="12" 
                  icon={CheckCircle2} 
                  iconColor="text-green-500" 
                  iconBg="bg-green-50" 
                />
                <SummaryCard 
                  title="Estimated Monthly Saving" 
                  value="₹840" 
                  icon={Zap} 
                  iconColor="text-[#1428A0]" 
                  iconBg="bg-blue-50" 
                />
                <SummaryCard 
                  title="Automated Devices" 
                  value="24" 
                  icon={Cpu} 
                  iconColor="text-[#2189FF]" 
                  iconBg="bg-blue-50/50" 
                />
                <SummaryCard 
                  title="Automation Status" 
                  value="Optimal" 
                  icon={ShieldCheck} 
                  iconColor="text-purple-500" 
                  iconBg="bg-purple-50" 
                />
              </div>

              {/* Automation Rules Grid */}
              <div className="pt-4">
                <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-400 mb-5 ml-1">Energy Saving Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                  {rulesData.map(rule => (
                    <AutomationRuleCard key={rule.id} rule={rule} />
                  ))}
                  
                  {/* Blank Add New Rule Card */}
                  <div className="bg-[#F7F9FC] border-2 border-dashed border-gray-300 hover:border-[#2189FF]/50 hover:bg-white rounded-[28px] p-8 flex flex-col items-center justify-center h-full group cursor-pointer transition-all duration-300 min-h-[380px] hover:shadow-lg">
                    <div className="w-16 h-16 rounded-[20px] bg-white shadow-sm ring-1 ring-gray-100/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Plus size={28} className="text-gray-400 group-hover:text-[#2189FF]" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-[17px] font-bold text-gray-900 mb-2">Create Custom Rule</h3>
                    <p className="text-sm font-medium text-gray-500 text-center max-w-[200px] leading-relaxed">Design a new IF/THEN automation policy.</p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 pb-8 border-t border-gray-100/80">
                <button className="px-7 py-3.5 rounded-[16px] border-2 border-gray-100 bg-white text-gray-700 font-bold text-[14px] hover:bg-gray-50 hover:border-gray-200 hover:text-gray-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-sm hover:shadow">
                  <FlaskConical size={18} strokeWidth={2.5} className="text-gray-400" />
                  Run Simulation
                </button>
                <button className="px-7 py-3.5 rounded-[16px] bg-[#1428A0] text-white font-bold text-[14px] hover:bg-[#102080] transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.35)] active:scale-[0.98] flex items-center justify-center gap-2.5">
                  <Plus size={18} strokeWidth={2.5} className="text-blue-200" />
                  Create New Rule
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}