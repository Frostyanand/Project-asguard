import React, { useState } from 'react';
import { 
  LayoutDashboard, Video, Box, Bot, FlaskConical, Settings, Bell, BarChart3,
  RefreshCw, Zap, IndianRupee, Activity, TrendingDown, TrendingUp,
  Thermometer, Lightbulb, Tv, Flame, Shirt, ChevronRight, CheckCircle2,
  Clock, ShieldCheck, Leaf, ArrowRight, Play
} from 'lucide-react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  body { font-family: 'Inter', sans-serif; background-color: #F7F9FC; margin: 0; }
  .premium-shadow { box-shadow: 0 8px 32px rgba(20, 40, 160, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02); }
  .chart-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawLine 2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes drawLine { to { stroke-dashoffset: 0; } }
`;

const SidebarItem = ({ icon: Icon, label, active }) => (
  <button className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold transition-all ${active ? 'bg-[#1428A0]/10 text-[#1428A0]' : 'text-gray-500 hover:bg-gray-50'}`}>
    <Icon size={22} className={active ? 'text-[#1428A0]' : 'text-gray-400'} />
    <span className="text-sm">{label}</span>
  </button>
);

const SummaryCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-[24px] p-6 premium-shadow flex flex-col justify-between h-full">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${color}`}>
      <Icon size={24} className="text-[#1428A0]" />
    </div>
    <h4 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-none mb-1">{value}</h4>
    <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400">{title}</p>
  </div>
);

export default function App() {
  const [mode, setMode] = useState('Eco Mode');
  const modes = ['Current Mode', 'Eco Mode', 'Comfort Mode', 'Vacation Mode', 'Custom Mode'];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="flex h-screen w-full bg-[#F7F9FC] text-gray-900">
        <aside className="hidden lg:flex w-[280px] bg-white border-r border-gray-200/60 flex-col">
          <div className="h-24 px-8 flex items-center font-bold text-2xl gap-2"><div className="w-8 h-8 rounded-lg bg-[#1428A0] text-white flex items-center justify-center"><Box size={18}/></div>ASGUARD</div>
          <div className="flex-1 px-4 py-4 space-y-1">
            {['Dashboard', 'Upload Room Video', 'Digital Twin', 'AI Assistant', 'Automation Rules', 'Analytics', 'Simulation'].map(l => (
              <SidebarItem key={l} icon={FlaskConical} label={l} active={l === 'Simulation'} />
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-y-auto px-10 py-8">
          <header className="mb-8">
            <h2 className="text-[26px] font-bold text-gray-900 tracking-tight mb-1">Energy Simulation</h2>
            <p className="text-sm text-gray-500">Compare different energy-saving strategies before applying SmartThings automation.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard title="Current Monthly Cost" value="₹4,860" icon={IndianRupee} color="bg-blue-50" />
            <SummaryCard title="Current Energy Usage" value="382 kWh" icon={Zap} color="bg-orange-50" />
            <SummaryCard title="Carbon Footprint" value="126 kg CO₂" icon={Leaf} color="bg-green-50" />
            <SummaryCard title="Estimated Monthly Saving" value="₹420" icon={TrendingDown} color="bg-purple-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[28px] premium-shadow">
              <h3 className="font-bold text-xl mb-6">Select Simulation Mode</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {modes.map(m => (
                  <button key={m} onClick={() => setMode(m)} className={`p-4 rounded-2xl border-2 font-bold transition-all ${mode === m ? 'border-[#1428A0] bg-blue-50 text-[#1428A0]' : 'border-gray-100 hover:border-gray-200'}`}>
                    {m}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-bold text-xl mb-6">Energy Prediction Graph</h3>
                <svg className="w-full h-48 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,35 C20,30 40,10 60,15 C80,20 100,5" fill="none" stroke="#2189FF" strokeWidth="3" className="chart-line" />
                  <path d="M0,38 C20,35 40,20 60,25 C80,30 100,20" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="4" />
                </svg>
              </div>
            </div>

            <div className="bg-[#1428A0] text-white p-8 rounded-[28px] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xl mb-6">Prediction Summary</h3>
                <div className="space-y-4">
                  {[ {l:'Estimated Saving', v:'₹420'}, {l:'Energy Reduction', v:'14%'}, {l:'Carbon Reduction', v:'9%'}, {l:'Confidence', v:'High'} ].map(item => (
                    <div key={item.l} className="flex justify-between border-b border-[#2189FF] pb-2">
                      <span className="text-blue-200 text-sm">{item.l}</span>
                      <span className="font-bold">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full bg-white text-[#1428A0] py-4 rounded-xl font-bold mt-8 hover:bg-gray-50 flex items-center justify-center gap-2">
                <CheckCircle2 size={20} /> Apply SmartThings Automation
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[28px] premium-shadow mb-8">
            <h3 className="font-bold text-xl mb-6">Recommended Optimizations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Increase AC Temperature', saving: '₹120', status: 'Active' },
                { title: 'Delay Water Heater', saving: '₹80', status: 'Active' },
                { title: 'Turn Off Idle Lights', saving: '₹50', status: 'Active' },
                { title: 'Enable Smart TV Sleep', saving: '₹40', status: 'Pending' }
              ].map(opt => (
                <div key={opt.title} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                  <div>
                    <p className="font-bold text-gray-900">{opt.title}</p>
                    <p className="text-xs text-green-600 font-bold">Estimated Saving: {opt.saving}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${opt.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-100'}`}>{opt.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pb-12">
            <button className="px-8 py-4 rounded-2xl font-bold bg-white border border-gray-200 flex items-center gap-2"><RefreshCw size={18}/> Reset</button>
            <button className="px-8 py-4 rounded-2xl font-bold bg-[#1428A0] text-white flex items-center gap-2"><Play size={18}/> Run Simulation</button>
          </div>
        </main>
      </div>
    </>
  );
}