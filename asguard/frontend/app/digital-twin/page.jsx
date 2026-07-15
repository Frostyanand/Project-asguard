'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
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
  FlaskConical,
  CheckCircle2,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Page-local Sub-components ─────────────────────────────────────────────────

function RoomCard({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-[18px] transition-all duration-300 shadow-sm outline-none
        ${active
          ? 'bg-[#1428A0] text-white ring-4 ring-[#1428A0]/15 premium-shadow scale-[1.02]'
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:ring-2 hover:ring-gray-200 ring-1 ring-gray-100/80 active:scale-[0.98]'
        }`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0 ${active ? 'bg-white/20' : 'bg-[#F7F9FC] text-[#1428A0]'}`}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <span className="text-[15px] font-bold tracking-tight">{label}</span>
    </button>
  )
}

function DeviceCard({ icon: Icon, name, status, power, consumption }) {
  return (
    <div className="bg-white rounded-[22px] p-5 lg:p-6 premium-shadow ring-1 ring-gray-100/80 flex flex-col gap-5 group hover:ring-[#2189FF]/30 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-[#F7F9FC] group-hover:bg-[#2189FF]/10 flex items-center justify-center transition-colors shrink-0">
            <Icon size={24} className="text-[#1428A0] group-hover:text-[#2189FF]" strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-gray-900 leading-tight mb-1">{name}</h4>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${status === 'Online' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{status}</span>
            </div>
          </div>
        </div>
        {/* Power Toggle */}
        <div
          className={`w-12 rounded-full flex items-center px-1 transition-colors cursor-pointer mt-1 ${power === 'ON' ? 'bg-[#2189FF]' : 'bg-gray-200'}`}
          style={{ height: '26px' }}
        >
          <div
            className={`rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-out ${power === 'ON' ? 'translate-x-[22px]' : 'translate-x-0'}`}
            style={{ width: '18px', height: '18px' }}
          />
        </div>
      </div>
      {consumption && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100/80 mt-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Today&apos;s Consumption</span>
          <span className="text-sm font-bold text-[#1428A0] bg-blue-50/50 px-2.5 py-1 rounded-md">{consumption}</span>
        </div>
      )}
    </div>
  )
}

// ── DigitalTwin Page ──────────────────────────────────────────────────────────
export default function DigitalTwin() {
  const [activeRoom, setActiveRoom] = useState('Living Room')
  const router = useRouter()

  const readyBadge = (
    <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-widest flex items-center gap-1.5 shadow-sm mt-1">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      READY
    </span>
  )

  return (
    <AppLayout>
      <Header title="Interactive Digital Twin" titleExtra={readyBadge} subtitle="Interact with your reconstructed smart home." />

      <div className="flex-1 flex gap-8 px-10 pb-10 overflow-hidden">

        {/* LEFT: Room Selector */}
        <div className="w-[260px] flex flex-col shrink-0 h-full z-20">
          <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 ml-1">Select Room</h3>
          <div className="flex flex-col gap-4 overflow-y-auto pb-4 pr-3 scroll-smooth">
            <RoomCard icon={Sofa}    label="Living Room" active={activeRoom === 'Living Room'} onClick={() => setActiveRoom('Living Room')} />
            <RoomCard icon={Bed}     label="Bedroom"     active={activeRoom === 'Bedroom'}     onClick={() => setActiveRoom('Bedroom')} />
            <RoomCard icon={Utensils} label="Kitchen"    active={activeRoom === 'Kitchen'}     onClick={() => setActiveRoom('Kitchen')} />
            <RoomCard icon={Bath}    label="Bathroom"    active={activeRoom === 'Bathroom'}    onClick={() => setActiveRoom('Bathroom')} />
          </div>
        </div>

        {/* CENTER: 3D Viewer */}
        <div className="flex-1 flex flex-col h-full gap-8 min-w-0 z-10">

          <div className="flex-1 bg-white rounded-[32px] premium-shadow ring-1 ring-gray-100/60 relative overflow-hidden flex flex-col group">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-[#E8F1FC]/25" />
            <div className="absolute inset-0 perspective-grid opacity-20" />

            {/* Isometric SVG */}
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
                <path d="M400,480 L150,330 L400,180 L650,330 Z" fill="url(#floorGradient)" stroke="#2189FF" strokeWidth="2.5" strokeOpacity="0.4" />
                <path d="M150,330 L400,480 L400,220 L150,70 Z" fill="url(#wallGradient)" stroke="#1428A0" strokeWidth="2.5" strokeOpacity="0.4" />
                <path d="M400,480 L650,330 L650,70 L400,220 Z" fill="url(#wallGradient)" stroke="#1428A0" strokeWidth="2.5" strokeOpacity="0.4" />
                <path d="M275,255 L525,405 M212,292 L462,442 M337,217 L587,367 M462,217 L212,367 M525,255 L275,405 M587,292 L337,442" stroke="#2189FF" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="6 6" />
                {/* Sofa */}
                <path d="M330,360 L450,432 L510,396 L390,324 Z" fill="white" fillOpacity="0.9" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M330,360 L330,320 L390,284 L390,324 Z" fill="white" fillOpacity="0.75" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M390,284 L510,356 L510,396 L390,324 Z" fill="white" fillOpacity="0.5" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
                {/* TV */}
                <path d="M220,200 L350,278 L350,210 L220,132 Z" fill="#0f172a" stroke="#2189FF" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M225,198 L345,270 L345,215 L225,143 Z" fill="#2189FF" fillOpacity="0.25" />
                {/* AC */}
                <path d="M450,150 L580,72 L580,90 L450,168 Z" fill="white" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M450,168 L580,90 L580,100 L450,178 Z" fill="#e2e8f0" fillOpacity="0.8" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
                {/* Nodes */}
                <circle cx="285" cy="205" r="7" fill="#2189FF" className="node-pulse" />
                <line x1="285" y1="205" x2="285" y2="150" stroke="#2189FF" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="515" cy="120" r="7" fill="#2189FF" className="node-pulse" style={{ animationDelay: '0.5s' }} />
                <line x1="515" y1="120" x2="515" y2="60" stroke="#2189FF" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="400" cy="260" r="7" fill="#2189FF" className="node-pulse" style={{ animationDelay: '1s' }} />
                <line x1="400" y1="260" x2="400" y2="120" stroke="#2189FF" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Viewer Controls */}
            <div className="absolute top-8 right-8 glass-panel p-2.5 rounded-[20px] shadow-lg ring-1 ring-gray-900/5 flex flex-col gap-2 z-20 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#2189FF] text-gray-500 transition-colors shadow-sm hover:shadow"><ZoomIn size={22} strokeWidth={2.5} /></button>
              <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#2189FF] text-gray-500 transition-colors shadow-sm hover:shadow"><ZoomOut size={22} strokeWidth={2.5} /></button>
              <div className="w-8 h-[2px] bg-gray-200/80 mx-auto my-1.5 rounded-full" />
              <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#1428A0] text-gray-500 transition-colors shadow-sm hover:shadow"><RotateCcw size={22} strokeWidth={2.5} /></button>
              <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#1428A0] text-gray-500 transition-colors shadow-sm hover:shadow"><LocateFixed size={22} strokeWidth={2.5} /></button>
              <div className="w-8 h-[2px] bg-gray-200/80 mx-auto my-1.5 rounded-full" />
              <button className="p-2.5 rounded-xl hover:bg-white hover:text-[#1428A0] text-gray-500 transition-colors shadow-sm hover:shadow"><Maximize size={22} strokeWidth={2.5} /></button>
            </div>

            {/* Live Badge */}
            <div className="absolute top-8 left-8 flex gap-3 z-20 pointer-events-none">
              <div className="glass-panel px-4 py-2.5 rounded-xl text-sm font-bold text-[#1428A0] ring-1 ring-gray-900/5 shadow-sm flex items-center gap-2">
                <Activity size={18} strokeWidth={2.5} /> Live Sync Active
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white rounded-[28px] premium-shadow ring-1 ring-gray-100/60 p-7 flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-8 lg:gap-14 pl-2">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Current Room</p>
                <p className="text-[22px] font-bold text-gray-900 leading-none tracking-tight">{activeRoom}</p>
              </div>
              <div className="w-[1px] h-12 bg-gray-100" />
              <div>
                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Energy Score</p>
                <p className="text-[22px] font-bold text-green-600 leading-none flex items-center gap-1.5 tracking-tight">
                  89<span className="text-base font-bold text-gray-400">/100</span>
                </p>
              </div>
              <div className="w-[1px] h-12 bg-gray-100 hidden xl:block" />
              <div className="hidden xl:block">
                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Current Usage</p>
                <p className="text-[22px] font-bold text-gray-900 leading-none tracking-tight">2.4 kWh</p>
              </div>
              <div className="w-[1px] h-12 bg-gray-100" />
              <div>
                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Devices</p>
                <p className="text-[22px] font-bold text-[#1428A0] leading-none tracking-tight">5</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/analytics')}
                className="px-6 py-4 rounded-xl border-2 border-gray-100 bg-white text-gray-700 font-bold text-[15px] hover:bg-gray-50 hover:border-gray-200 hover:text-gray-900 transition-all active:scale-[0.98]"
              >
                View Analytics
              </button>
              <button
                onClick={() => router.push('/simulation')}
                className="px-7 py-4 rounded-xl bg-[#1428A0] text-white font-bold text-[15px] hover:bg-[#102080] transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.35)] active:scale-[0.98] flex items-center gap-2.5"
              >
                <FlaskConical size={18} strokeWidth={2.5} /> Run Simulation
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Devices */}
        <div className="w-[340px] flex flex-col shrink-0 h-full z-20">
          <div className="flex items-center justify-between mb-6 px-1.5">
            <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400">Connected Devices</h3>
            <span className="text-xs font-bold text-[#2189FF] bg-blue-50/80 ring-1 ring-blue-100/50 px-2.5 py-1 rounded-md shadow-sm">5 Online</span>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto pb-4 pr-3 scroll-smooth">
            <DeviceCard icon={Wind}     name="Samsung WindFree AC" status="Online"  power="ON"  consumption="1.2 kWh" />
            <DeviceCard icon={Tv}       name="Samsung Frame TV"    status="Online"  power="ON"  consumption="0.8 kWh" />
            <DeviceCard icon={Lightbulb} name="Smart Lighting"     status="Online"  power="ON"  consumption="0.3 kWh" />
            <DeviceCard icon={Blinds}   name="Smart Curtains"      status="Online"  power="OFF" />
            <DeviceCard icon={Fan}      name="Ceiling Fan"         status="Offline" power="OFF" />
          </div>
        </div>
      </div>

      {/* Floating AI Button */}
      <button
        onClick={() => router.push('/ai-assistant')}
        className="absolute bottom-12 right-12 z-50 bg-gradient-to-r from-[#1428A0] to-[#2189FF] text-white pl-5 pr-6 py-4 rounded-full shadow-[0_8px_30px_rgba(33,137,255,0.4)] hover:shadow-[0_12px_40px_rgba(33,137,255,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 font-bold text-[15px] group ring-4 ring-white"
      >
        <div className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
          <Sparkles size={20} className="text-white fill-white" />
        </div>
        Ask ASGUARD AI
      </button>
    </AppLayout>
  )
}
