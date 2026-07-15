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
  MessageSquare,
  Thermometer,
  Power,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
  Send,
  Zap,
  TrendingDown,
  CheckCircle2,
  ThumbsUp,
  SlidersHorizontal
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
    box-shadow: 0 8px 40px rgba(20, 40, 160, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02);
  }
  
  .glass-panel {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
  }

  /* Custom Scrollbar for Chat */
  .chat-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .chat-scroll::-webkit-scrollbar-track {
    background: transparent; 
  }
  .chat-scroll::-webkit-scrollbar-thumb {
    background: rgba(20, 40, 160, 0.1); 
    border-radius: 10px;
  }
  .chat-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(20, 40, 160, 0.2); 
  }

  .ai-glow {
    animation: aiGlow 3s infinite alternate;
  }

  @keyframes aiGlow {
    0% { box-shadow: 0 0 0 0 rgba(33, 137, 255, 0.15); }
    100% { box-shadow: 0 0 0 12px rgba(33, 137, 255, 0); }
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

const SuggestedQuestion = ({ text }) => (
  <button className="w-full bg-white rounded-[16px] p-4 premium-shadow ring-1 ring-gray-100/60 hover:ring-[#2189FF]/30 hover:shadow-md transition-all duration-300 text-left group flex items-start gap-3 active:scale-[0.98] h-full">
    <MessageSquare size={16} className="text-[#2189FF] shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
    <span className="text-[13px] font-bold text-gray-700 group-hover:text-gray-900 leading-snug pr-1">{text}</span>
  </button>
);

const InsightCard = ({ icon: Icon, title, value, type }) => {
  const isAlert = type === 'alert';
  return (
    <div className="bg-white rounded-[20px] p-4 lg:p-5 premium-shadow ring-1 ring-gray-100/60 flex items-center gap-4 group hover:ring-blue-100/80 transition-all duration-300 h-full">
      <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors
        ${isAlert ? 'bg-red-50 text-red-500 group-hover:bg-red-100' : 'bg-[#F7F9FC] text-[#1428A0] group-hover:bg-[#2189FF]/10 group-hover:text-[#2189FF]'}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <h4 className="text-[13px] lg:text-[14px] font-bold text-gray-900 leading-tight mb-1.5">{title}</h4>
        <div className="flex items-center gap-2">
          {isAlert ? (
            <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">{value}</span>
          ) : (
            <>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Potential Saving</span>
              <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md ring-1 ring-green-100/50">{value}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickActionBtn = ({ icon: Icon, label, primary }) => (
  <button className={`px-4 py-3 rounded-[14px] font-bold text-[13px] transition-all duration-300 flex items-center gap-2 active:scale-[0.98] hover:-translate-y-0.5
    ${primary 
      ? 'bg-[#1428A0] text-white hover:bg-[#102080] shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.35)]' 
      : 'bg-white border-2 border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200 hover:text-gray-900 shadow-sm hover:shadow'
    }`}
  >
    {Icon && <Icon size={16} strokeWidth={2.5} className={primary ? "text-blue-200" : "text-gray-400"} />}
    {label}
  </button>
);

// --- Main Application ---
export default function App() {
  const [activeTab, setActiveTab] = useState('AI Assistant');

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

  const suggestedQuestions = [
    "How can I reduce my electricity bill?",
    "Which appliance consumes the most energy?",
    "Why was today's usage higher?",
    "Show my highest energy-consuming room.",
    "Recommend the best automation."
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
              <div className="flex items-center gap-3 mb-1.5">
                <h2 className="text-[26px] font-bold text-gray-900 tracking-tight">AI Energy Assistant</h2>
                <div className="bg-gradient-to-r from-[#1428A0] to-[#2189FF] text-white p-1.5 rounded-lg shadow-sm">
                  <Sparkles size={16} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">Ask ASGUARD anything about your home's energy usage.</p>
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

          {/* 3-Column Layout: Adjusted for wider center AI chat area */}
          <div className="flex-1 flex gap-6 lg:gap-8 px-10 pb-10 overflow-hidden">
            
            {/* --- LEFT PANEL: Compact Suggested Questions --- */}
            <div className="w-[220px] lg:w-[240px] flex flex-col shrink-0 h-full z-20">
              <h3 className="text-[12px] font-bold tracking-widest uppercase text-gray-400 mb-5 ml-1">Suggested Questions</h3>
              <div className="flex flex-col gap-3 overflow-y-auto pb-4 pr-2 scroll-smooth">
                {suggestedQuestions.map((q, idx) => (
                  <SuggestedQuestion key={idx} text={q} />
                ))}
              </div>
            </div>

            {/* --- CENTER: Expansive Conversation Window (~50% visual width) --- */}
            <div className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
              
              {/* Chat History Area */}
              <div className="flex-1 bg-white rounded-[32px] premium-shadow ring-1 ring-gray-100/60 overflow-hidden flex flex-col">
                
                {/* Scrollable Messages */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-10 chat-scroll flex flex-col gap-10">
                  
                  {/* User Message */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3 mb-1 pr-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">You</span>
                    </div>
                    <div className="bg-[#F7F9FC] ring-1 ring-gray-200/80 text-gray-900 rounded-[24px] rounded-tr-[8px] px-6 py-4 max-w-[85%] md:max-w-[75%] shadow-sm">
                      <p className="text-[15px] font-semibold leading-relaxed">How can I reduce my electricity bill?</p>
                    </div>
                  </div>

                  {/* ASGUARD AI Response (Full Width Design) */}
                  <div className="flex flex-col items-start gap-3.5 w-full">
                    <div className="flex items-center gap-3 mb-1 ml-1.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center shadow-md ai-glow">
                        <Bot size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-[13px] font-extrabold text-[#1428A0] tracking-wide">ASGUARD AI</span>
                    </div>
                    
                    {/* Full Width Bubble */}
                    <div className="bg-white ring-1 ring-blue-100/50 text-gray-800 rounded-[32px] rounded-tl-[10px] p-8 lg:p-10 w-full shadow-[0_12px_40px_rgba(20,40,160,0.06)]">
                      
                      <div className="space-y-6">
                        <p className="text-[15px] lg:text-[16px] font-medium leading-relaxed">
                          Your <span className="font-bold text-gray-900">Samsung WindFree AC</span> contributed <span className="font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg ring-1 ring-orange-100/50 mx-1">38%</span> of today's total energy usage.
                        </p>
                        
                        <p className="text-[15px] lg:text-[16px] font-medium leading-relaxed">
                          Increasing the temperature from <span className="font-bold text-[#1428A0] bg-blue-50/80 px-2.5 py-1 rounded-lg ring-1 ring-blue-100/50 mx-1">22°C</span> to <span className="font-bold text-[#1428A0] bg-blue-50/80 px-2.5 py-1 rounded-lg ring-1 ring-blue-100/50 mx-1">24°C</span> can reduce energy consumption by approximately 10%.
                        </p>
                        
                        {/* Highlight Metrics Box (Restructured for full width) */}
                        <div className="bg-gradient-to-r from-[#F4F7FB] to-white border border-gray-100/80 rounded-[24px] p-6 lg:p-7 flex flex-wrap items-center gap-8 lg:gap-12 shadow-sm mt-4">
                          <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <TrendingDown size={16} className="text-green-500" strokeWidth={2.5} />
                              Estimated Monthly Saving
                            </p>
                            <p className="text-[32px] lg:text-[36px] font-extrabold text-[#1428A0] tracking-tighter leading-none mt-1">₹420</p>
                          </div>
                          <div className="w-[1px] h-12 bg-gray-200/80 hidden sm:block"></div>
                          <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-[#2189FF]" strokeWidth={2.5} />
                              Confidence
                            </p>
                            <p className="text-[22px] lg:text-[24px] font-extrabold text-gray-900 tracking-tight leading-none mt-1">High</p>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Quick Actions inside chat flow (Compact sizing to fit perfectly) */}
                    <div className="mt-4 ml-2 flex flex-wrap gap-3">
                      <QuickActionBtn primary icon={SlidersHorizontal} label="Apply Recommendation" />
                      <QuickActionBtn icon={RefreshCw} label="Create Automation Rule" />
                      <QuickActionBtn icon={FlaskConical} label="Run Energy Simulation" />
                      <QuickActionBtn icon={BarChart3} label="View Analytics" />
                    </div>

                  </div>
                </div>

                {/* Input Area */}
                <div className="p-6 lg:p-8 bg-white border-t border-gray-100/80 shrink-0">
                  <div className="relative flex items-center bg-[#F7F9FC] rounded-[24px] ring-1 ring-gray-200/80 focus-within:ring-2 focus-within:ring-[#2189FF] focus-within:bg-white transition-all shadow-sm group">
                    <div className="pl-7 pr-3 text-gray-400 group-focus-within:text-[#2189FF] transition-colors">
                      <Sparkles size={22} strokeWidth={2} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Ask a follow-up question..." 
                      className="flex-1 bg-transparent py-4 outline-none text-[15px] text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-medium"
                    />
                    <div className="pr-3.5 pl-3">
                      <button className="w-12 h-12 rounded-[18px] bg-[#1428A0] text-white flex items-center justify-center hover:bg-[#102080] transition-colors shadow-md group-hover:shadow-lg hover:-translate-y-0.5 transform duration-300">
                        <Send size={18} strokeWidth={2.5} className="mr-0.5 mt-0.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-[11px] font-bold text-gray-400 mt-5 tracking-wide">
                    ASGUARD AI can make mistakes. Consider verifying important automation changes.
                  </p>
                </div>

              </div>
            </div>

            {/* --- RIGHT PANEL: Compact AI Insights --- */}
            <div className="w-[260px] lg:w-[280px] flex flex-col shrink-0 h-full z-20">
              <div className="flex items-center justify-between mb-5 px-1.5">
                <h3 className="text-[12px] font-bold tracking-widest uppercase text-gray-400">Today's AI Insights</h3>
                <span className="text-[10px] font-bold text-[#1428A0] bg-blue-50 ring-1 ring-blue-100/50 px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">Updated</span>
              </div>
              
              <div className="flex flex-col gap-3.5 overflow-y-auto pb-4 pr-2 scroll-smooth">
                <InsightCard 
                  icon={Thermometer}
                  title="Climate Optimization"
                  value="10%"
                  type="saving"
                />
                <InsightCard 
                  icon={Power}
                  title="Standby Power"
                  value="5%"
                  type="saving"
                />
                <InsightCard 
                  icon={Lightbulb}
                  title="Lighting Optimization"
                  value="8%"
                  type="saving"
                />
                <InsightCard 
                  icon={AlertTriangle}
                  title="Peak Hour Alert"
                  value="High Consumption"
                  type="alert"
                />
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}