'use client'

import { useRouter } from 'next/navigation'
import {
  Thermometer,
  Zap,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Wifi,
  BarChart3,
  RefreshCw,
  Power,
  Settings,
  Activity,
  Home,
  Smartphone,
  Bot,
  FlaskConical,
  Bell,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Page-local Sub-components ─────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, subtext, colorClass, bgClass }) {
  return (
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
  )
}

function QuickActionCard({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-[24px] p-6 premium-shadow ring-1 ring-gray-100/50 hover:ring-[#2189FF]/30 hover:shadow-lg transition-all duration-300 group flex flex-col items-center justify-center gap-4 active:scale-[0.98] h-full"
    >
      <div className="w-16 h-16 rounded-[20px] bg-[#F7F9FC] group-hover:bg-[#2189FF]/10 flex items-center justify-center transition-colors duration-300">
        <Icon size={28} className="text-[#1428A0] group-hover:text-[#2189FF] transition-colors" />
      </div>
      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 text-center leading-tight">{label}</span>
    </button>
  )
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()

  return (
    <AppLayout>
      <Header title="Welcome Back" subtitle="Home Overview" />

      {/* Scrollable Dashboard Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-16 scroll-smooth">
        <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">

          {/* Row 1: Hero & AI Rec */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

            {/* Hero Card */}
            <div className="lg:col-span-8 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 relative overflow-hidden flex flex-col justify-between h-full min-h-[280px]">
              <div className="absolute right-0 top-0 w-full md:w-[400px] h-full pointer-events-none opacity-40">
                <svg viewBox="0 0 200 200" fill="none" className="w-full h-full absolute right-[-10%] top-[-10%] scale-[1.3] text-[#2189FF]">
                  <path d="M100 20 L180 80 L180 170 L20 170 L20 80 Z" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="opacity-30" />
                  <path d="M100 30 L170 85 L170 160 L30 160 L30 85 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M30 85 L100 120 L170 85" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M100 120 L100 160" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-500">Digital Twin Status</h3>
                  <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    READY
                  </span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">Your home has been successfully reconstructed.</h2>
                <p className="text-gray-500 font-semibold flex items-center gap-2 mb-10">
                  <CheckCircle2 size={18} className="text-[#2189FF]" />
                  Last Scan: Today at 09:41 AM
                </p>
                <button
                  onClick={() => router.push('/digital-twin')}
                  className="bg-[#1428A0] hover:bg-[#102080] text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.3)] flex items-center gap-2 active:scale-[0.98] w-max"
                >
                  Open Digital Twin
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="lg:col-span-4 bg-gradient-to-br from-[#1428A0] to-[#1a36c4] rounded-[24px] p-8 lg:p-10 premium-shadow relative overflow-hidden text-white flex flex-col justify-between h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2189FF] rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                    <Bot size={22} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-blue-100">Latest Recommendation</h3>
                </div>
                <p className="text-xl lg:text-2xl font-medium leading-snug mb-8">
                  Increase AC temperature from{' '}
                  <span className="font-bold text-[#2189FF] bg-white px-2 py-1 rounded-lg mx-1 shadow-sm">22°C</span>
                  {' '}to{' '}
                  <span className="font-bold text-[#2189FF] bg-white px-2 py-1 rounded-lg mx-1 shadow-sm">24°C</span>.
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

          {/* Row 2: Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
            <StatCard icon={Wifi}     label="Connected Devices"   value="14"       subtext="SmartThings Hub Active" colorClass="text-[#2189FF]"    bgClass="bg-[#2189FF]/10" />
            <StatCard icon={Power}    label="Today's Energy Usage" value="12.4 kWh" subtext="-2.1% from yesterday" colorClass="text-orange-500"   bgClass="bg-orange-50" />
            <StatCard icon={Settings} label="Automation Rules"    value="8"        subtext="Running perfectly"      colorClass="text-purple-500"  bgClass="bg-purple-50" />
            <StatCard icon={Activity} label="Efficiency Score"    value="94/100"   subtext="Excellent condition"    colorClass="text-green-500"   bgClass="bg-green-50" />
          </div>

          {/* Row 3: Quick Actions */}
          <div className="pt-2">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-500 mb-5 ml-1">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 items-stretch">
              <QuickActionCard icon={Smartphone}   label="Scan Room"          onClick={() => router.push('/upload')} />
              <QuickActionCard icon={Home}          label="View Digital Twin"  onClick={() => router.push('/digital-twin')} />
              <QuickActionCard icon={Bot}           label="AI Assistant"       onClick={() => router.push('/ai-assistant')} />
              <QuickActionCard icon={BarChart3}     label="Analytics"          onClick={() => router.push('/analytics')} />
              <QuickActionCard icon={FlaskConical}  label="Simulation"         onClick={() => router.push('/simulation')} />
            </div>
          </div>

          {/* Row 4: Chart & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-2">

            {/* Line Chart */}
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

              <div className="relative flex-1 w-full min-h-[240px] pt-8 pb-4">
                <div className="absolute left-0 top-6 bottom-12 flex flex-col justify-between text-[10px] font-medium text-gray-400 w-10">
                  <span>30k</span><span>20k</span><span>10k</span><span>0</span>
                </div>
                <div className="absolute left-14 right-4 top-8 bottom-12">
                  <div className="absolute inset-0 flex flex-col justify-between">
                    <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                    <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                    <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                    <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                  </div>
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2189FF" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#2189FF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path className="chart-fill" d="M0,75 C2,70 4,80 6,75 C8,70 10,65 12,68 C14,70 16,55 18,50 C20,45 22,50 24,45 C26,40 28,30 30,35 C32,40 34,42 36,38 C38,34 40,25 42,28 C44,30 46,20 48,15 C50,10 52,15 54,12 C56,10 58,18 60,20 C62,22 64,15 66,12 C68,10 70,25 72,28 C74,30 76,20 78,15 C80,10 82,18 84,20 C86,22 88,30 90,25 C92,20 94,15 96,12 C98,10 99,15 100,10 L100,100 L0,100 Z" fill="url(#chartGradient)" />
                    <path className="chart-line" d="M0,75 C2,70 4,80 6,75 C8,70 10,65 12,68 C14,70 16,55 18,50 C20,45 22,50 24,45 C26,40 28,30 30,35 C32,40 34,42 36,38 C38,34 40,25 42,28 C44,30 46,20 48,15 C50,10 52,15 54,12 C56,10 58,18 60,20 C62,22 64,15 66,12 C68,10 70,25 72,28 C74,30 76,20 78,15 C80,10 82,18 84,20 C86,22 88,30 90,25 C92,20 94,15 96,12 C98,10 99,15 100,10" fill="none" stroke="#2189FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Hover-only markers for interaction density */}
                    <g className="chart-interaction-layer">
                      {[
                        { cx: 12, cy: 68 }, { cx: 24, cy: 45 }, { cx: 36, cy: 38 }, 
                        { cx: 48, cy: 15 }, { cx: 60, cy: 20 }, { cx: 72, cy: 28 }, 
                        { cx: 84, cy: 20 }, { cx: 96, cy: 12 }
                      ].map((pt, i) => (
                        <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="#2189FF" className="opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-crosshair" />
                      ))}
                    </g>
                  </svg>
                </div>
                <div className="absolute left-14 right-4 bottom-2 flex justify-between text-[10px] font-medium text-gray-400">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="lg:col-span-4 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 h-full">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-8">Recent Activity</h3>
              <div className="relative pl-7 space-y-9">
                <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-gray-100" />
                {[
                  { label: 'AI Recommendation Generated', time: 'Just now',        active: true },
                  { label: 'Firebase Synced',             time: '10 mins ago',    active: false },
                  { label: 'Digital Twin Generated',      time: 'Today, 09:45 AM', active: false },
                  { label: 'Room Scan Completed',         time: 'Today, 09:41 AM', active: false },
                ].map((item) => (
                  <div key={item.label} className="relative">
                    <div className={`absolute -left-7 top-0.5 w-7 h-7 rounded-full ${item.active ? 'bg-blue-50' : 'bg-gray-100'} border-[3px] border-white shadow-sm flex items-center justify-center`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${item.active ? 'bg-[#2189FF]' : 'bg-gray-400'}`} />
                    </div>
                    <p className={`text-sm font-bold ${item.active ? 'text-gray-900' : 'text-gray-700'}`}>{item.label}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1.5">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-6" />
        </div>
      </div>
    </AppLayout>
  )
}
