'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap,
  IndianRupee,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
  Play,
  Leaf,
  FlaskConical,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Page-local Sub-components ─────────────────────────────────────────────────

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-[24px] p-6 premium-shadow flex flex-col justify-between h-full">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${color}`}>
        <Icon size={24} className="text-[#1428A0]" />
      </div>
      <h4 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-none mb-1">{value}</h4>
      <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400">{title}</p>
    </div>
  )
}

// ── Simulation Page ───────────────────────────────────────────────────────────
export default function Simulation() {
  const [mode, setMode] = useState('Eco Mode')
  const router = useRouter()

  const modes = ['Current Mode', 'Eco Mode', 'Comfort Mode', 'Vacation Mode', 'Custom Mode']

  const optimizations = [
    { title: 'Increase AC Temperature', saving: '₹120', status: 'Active' },
    { title: 'Delay Water Heater',       saving: '₹80',  status: 'Active' },
    { title: 'Turn Off Idle Lights',     saving: '₹50',  status: 'Active' },
    { title: 'Enable Smart TV Sleep',    saving: '₹40',  status: 'Pending' },
  ]

  const predictionSummary = [
    { l: 'Estimated Saving',  v: '₹420' },
    { l: 'Energy Reduction',  v: '14%'  },
    { l: 'Carbon Reduction',  v: '9%'   },
    { l: 'Confidence',        v: 'High' },
  ]

  const simBadge = (
    <div className="bg-[#1428A0]/10 text-[#1428A0] p-1.5 rounded-lg shadow-sm">
      <FlaskConical size={16} strokeWidth={2.5} />
    </div>
  )

  return (
    <AppLayout>
      <Header
        title="Energy Simulation"
        titleExtra={simBadge}
        subtitle="Compare different energy-saving strategies before applying SmartThings automation."
      />

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-12 scroll-smooth">
        <div className="max-w-[1400px] mx-auto pt-4 space-y-6 lg:space-y-8">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard title="Current Monthly Cost"    value="₹4,860"    icon={IndianRupee}  color="bg-blue-50" />
            <SummaryCard title="Current Energy Usage"    value="382 kWh"   icon={Zap}          color="bg-orange-50" />
            <SummaryCard title="Carbon Footprint"        value="126 kg CO₂" icon={Leaf}         color="bg-green-50" />
            <SummaryCard title="Estimated Monthly Saving" value="₹420"     icon={TrendingDown}  color="bg-purple-50" />
          </div>

          {/* Mode Selector + Prediction */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Mode Selector + Graph */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[28px] premium-shadow">
              <h3 className="font-bold text-xl mb-6 text-gray-900">Select Simulation Mode</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {modes.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`p-4 rounded-2xl border-2 font-bold transition-all text-sm
                      ${mode === m ? 'border-[#1428A0] bg-blue-50 text-[#1428A0]' : 'border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-bold text-xl mb-6 text-gray-900">Energy Prediction Graph</h3>
                <svg className="w-full h-48 overflow-visible relative z-10" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <defs>
                    <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2189FF" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#2189FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="chart-fill" d="M0,35 C5,32 10,38 15,30 C20,25 25,28 30,22 C35,18 40,25 45,20 C50,15 55,18 60,12 C65,10 70,15 75,8 C80,5 85,10 90,6 C95,4 98,6 100,4 L100,40 L0,40 Z" fill="url(#simGradient)" />
                  <path d="M0,35 C5,32 10,38 15,30 C20,25 25,28 30,22 C35,18 40,25 45,20 C50,15 55,18 60,12 C65,10 70,15 75,8 C80,5 85,10 90,6 C95,4 98,6 100,4" fill="none" stroke="#2189FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="chart-line" />
                  <path d="M0,38 C5,35 10,40 15,33 C20,28 25,32 30,25 C35,22 40,28 45,23 C50,18 55,22 60,16 C65,14 70,18 75,12 C80,10 85,14 90,10 C95,8 98,10 100,8" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4" strokeLinecap="round" />
                  
                  {/* Hover-only markers for interaction density */}
                  <g className="chart-interaction-layer">
                    {[
                      { cx: 15, cy: 30 }, { cx: 30, cy: 22 }, { cx: 45, cy: 20 }, 
                      { cx: 60, cy: 12 }, { cx: 75, cy: 8 }, { cx: 90, cy: 6 }
                    ].map((pt, i) => (
                      <circle key={i} cx={pt.cx} cy={pt.cy} r="2.5" fill="#2189FF" className="opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-crosshair" />
                    ))}
                  </g>
                </svg>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2"><div className="w-4 h-1 bg-[#2189FF] rounded-full" /><span className="text-xs font-semibold text-gray-600">With Optimization</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-1 bg-gray-300 rounded-full" /><span className="text-xs font-semibold text-gray-600">Current</span></div>
                </div>
              </div>
            </div>

            {/* Prediction Summary */}
            <div className="bg-[#1428A0] text-white p-8 rounded-[28px] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xl mb-6">Prediction Summary</h3>
                <div className="space-y-4">
                  {predictionSummary.map((item) => (
                    <div key={item.l} className="flex justify-between border-b border-[#2189FF]/60 pb-3">
                      <span className="text-blue-200 text-sm font-medium">{item.l}</span>
                      <span className="font-bold">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full bg-white text-[#1428A0] py-4 rounded-xl font-bold mt-8 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
                <CheckCircle2 size={20} /> Apply SmartThings Automation
              </button>
            </div>
          </div>

          {/* Recommended Optimizations */}
          <div className="bg-white p-8 rounded-[28px] premium-shadow ring-1 ring-gray-100/80">
            <h3 className="font-bold text-xl mb-6 text-gray-900">Recommended Optimizations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optimizations.map((opt) => (
                <div key={opt.title} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{opt.title}</p>
                    <p className="text-xs text-green-600 font-bold mt-1">Estimated Saving: {opt.saving}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${opt.status === 'Active' ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-gray-100 text-gray-500'}`}>
                    {opt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-4 pb-8">
            <button
              onClick={() => router.push('/automation-rules')}
              className="px-8 py-4 rounded-2xl font-bold bg-white border border-gray-200 flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm"
            >
              <RefreshCw size={18} /> Reset
            </button>
            <button className="px-8 py-4 rounded-2xl font-bold bg-[#1428A0] text-white flex items-center gap-2 hover:bg-[#102080] transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] active:scale-[0.98]">
              <Play size={18} /> Run Simulation
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
