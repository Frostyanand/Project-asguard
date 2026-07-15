'use client'

import { useState, useEffect } from 'react'
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
  Home,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Move3D,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

import dynamic from "next/dynamic";

const Scene = dynamic(
  () => import("./components/Scene"),
  { ssr: false }
);

// ── Page-local Sub-components ─────────────────────────────────────────────────

function RoomCard({ letter, label, active, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-[18px] transition-all duration-300 shadow-sm border outline-none
        ${active
          ? 'bg-[#1428A0] text-white border-[#1428A0] ring-4 ring-[#1428A0]/15 premium-shadow scale-[1.02]'
          : 'bg-white text-gray-700 border-gray-105 hover:bg-gray-50 hover:border-gray-200 hover:ring-2 hover:ring-gray-100 active:scale-[0.98]'
        }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors
        ${active ? 'bg-white/20 text-white' : 'bg-[#F7F9FC] text-[#1428A0]'}`}>
        {letter}
      </div>
      <div className="flex-1 flex items-center justify-between min-w-0 font-bold">
        <span className="text-[15px] tracking-tight text-left truncate">{label}</span>
        {Icon && <Icon size={18} className={`${active ? 'text-white/60' : 'text-gray-400'} shrink-0`} />}
      </div>
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
  const [activeRoom, setActiveRoom] = useState('all')
  const [ceilingVisible, setCeilingVisible] = useState(false)
  const [focusMode, setFocusMode] = useState(true)
  const [roomCenters, setRoomCenters] = useState({})
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [viewMode, setViewMode] = useState('isometric')

  const router = useRouter()

  // Auto-traverse: when a specific room is selected, go interior. When 'all', go aerial.
  useEffect(() => {
    if (activeRoom === 'all') {
      setViewMode('isometric');
    } else {
      setViewMode('interior');
    }
  }, [activeRoom]);

  const roomNamesMap = {
    all: 'Entire Apartment',
    A: 'Bedroom 1 (Master)',
    B: 'Bedroom 2 (Guest)',
    C: 'Kitchen Space',
    D: 'Bathroom & Corridor',
    E: 'Living Room Space',
  }

  const roomList = [
    { id: 'all', label: 'Entire Apartment', letter: 'ALL', icon: Home },
    { id: 'A', label: 'Bedroom 1', letter: 'A', icon: Bed },
    { id: 'B', label: 'Bedroom 2', letter: 'B', icon: Bed },
    { id: 'C', label: 'Kitchen', letter: 'C', icon: Utensils },
    { id: 'D', label: 'Bathroom', letter: 'D', icon: Bath },
    { id: 'E', label: 'Living Room', letter: 'E', icon: Sofa },
  ]

  const devicesData = {
    all: [
      { icon: Wind, name: "Samsung WindFree AC", status: "Online", power: "ON", consumption: "1.2 kWh" },
      { icon: Tv, name: "Samsung Frame TV", status: "Online", power: "ON", consumption: "0.8 kWh" },
      { icon: Lightbulb, name: "Smart Lighting", status: "Online", power: "ON", consumption: "0.3 kWh" },
      { icon: Blinds, name: "Smart Curtains", status: "Online", power: "OFF" },
      { icon: Fan, name: "Ceiling Fan", status: "Offline", power: "OFF" },
    ],
    A: [
      { icon: Wind, name: "WindFree AC (Bedroom 1)", status: "Online", power: "ON", consumption: "0.6 kWh" },
      { icon: Lightbulb, name: "Bedside Reading Lamps", status: "Online", power: "ON", consumption: "0.1 kWh" },
      { icon: Blinds, name: "Blackout Blinds", status: "Online", power: "OFF" },
    ],
    B: [
      { icon: Wind, name: "AC (Bedroom 2)", status: "Offline", power: "OFF" },
      { icon: Lightbulb, name: "Bedroom 2 Spotlight", status: "Online", power: "ON", consumption: "0.15 kWh" },
    ],
    C: [
      { icon: Lightbulb, name: "Kitchen Task Lighting", status: "Online", power: "ON", consumption: "0.2 kWh" },
      { icon: Blinds, name: "Kitchen Blind", status: "Online", power: "OFF" },
    ],
    D: [
      { icon: Lightbulb, name: "Vanity Mirror Glow", status: "Online", power: "ON", consumption: "0.05 kWh" },
      { icon: Fan, name: "Exhaust Ventilator", status: "Online", power: "ON", consumption: "0.08 kWh" },
    ],
    E: [
      { icon: Wind, name: "Samsung WindFree AC", status: "Online", power: "ON", consumption: "1.2 kWh" },
      { icon: Tv, name: "Samsung Frame TV", status: "Online", power: "ON", consumption: "0.8 kWh" },
      { icon: Lightbulb, name: "Ambient Backlighting", status: "Online", power: "ON", consumption: "0.30 kWh" },
      { icon: Blinds, name: "Balcony Curtains", status: "Online", power: "OFF" },
    ]
  }

  const activeDevices = devicesData[activeRoom] || devicesData.all

  return (
    <AppLayout>
      {/* Full-screen immersive container — no header to maximize viewport */}
      <div className="flex-1 relative w-full h-full overflow-hidden select-none">

        {/* 3D Viewer fills entire viewport */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] to-[#111827]">
          <Scene
            activeRoom={activeRoom === 'all' ? null : activeRoom}
            setActiveRoom={setActiveRoom}
            ceilingVisible={ceilingVisible}
            focusMode={focusMode}
            roomCenters={roomCenters}
            setRoomCenters={setRoomCenters}
            viewMode={viewMode}
          />
        </div>

        {/* ── TOP BAR: Minimal info + controls ────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: Title + status */}
            <div className="flex items-center gap-4 pointer-events-auto">
              <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/90 font-bold text-sm tracking-tight">AEGIS Digital Twin</span>
                <span className="text-white/40 text-xs">•</span>
                <span className="text-white/50 text-xs font-medium">{roomNamesMap[activeRoom]}</span>
              </div>
            </div>

            {/* Right: Quick action buttons */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Ceiling toggle */}
              <button
                onClick={() => setCeilingVisible(!ceilingVisible)}
                className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${ceilingVisible ? 'bg-[#1428A0]/80 border-[#1428A0]/50 text-white' : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/60'}`}
                title={ceilingVisible ? "Hide Ceiling" : "Show Ceiling"}
              >
                {ceilingVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              {/* Focus toggle */}
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${focusMode ? 'bg-[#1428A0]/80 border-[#1428A0]/50 text-white' : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/60'}`}
                title={focusMode ? "Disable Focus" : "Enable Focus"}
              >
                <LocateFixed size={18} />
              </button>
              {/* Reset */}
              <button
                onClick={() => {
                  setActiveRoom('all');
                  setCeilingVisible(false);
                  setFocusMode(true);
                }}
                className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-black/60 transition-all"
                title="Reset View"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── LEFT EDGE: Room selector pills ──────────────────────────── */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
          <div className="flex flex-col gap-2">
            {roomList.map((room) => {
              const isActive = activeRoom === room.id;
              const Icon = room.icon;
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`group relative flex items-center gap-3 transition-all duration-300 rounded-2xl border backdrop-blur-md
                    ${isActive
                      ? 'bg-[#1428A0]/90 border-[#1428A0]/60 text-white px-5 py-3 shadow-[0_0_20px_rgba(20,40,160,0.4)]'
                      : 'bg-black/40 border-white/10 text-white/70 hover:text-white hover:bg-black/60 px-3.5 py-3 hover:px-5'
                    }`}
                  title={room.label}
                >
                  <span className={`font-black text-xs shrink-0 ${isActive ? 'text-white' : 'text-white/80'}`}>
                    {room.letter}
                  </span>
                  <span className={`text-[13px] font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300
                    ${isActive ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100'}`}>
                    {room.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BOTTOM CENTER: Perspective toggle + info ─────────────────── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="bg-black/50 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
            {/* Perspective switcher */}
            {activeRoom !== 'all' && (
              <>
                <div className="flex bg-white/10 p-0.5 rounded-xl">
                  <button
                    onClick={() => setViewMode('isometric')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'isometric' ? 'bg-white text-gray-900 shadow-sm' : 'text-white/60 hover:text-white'}`}
                  >
                    Aerial
                  </button>
                  <button
                    onClick={() => setViewMode('interior')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'interior' ? 'bg-white text-gray-900 shadow-sm' : 'text-white/60 hover:text-white'}`}
                  >
                    Traverse
                  </button>
                </div>
                <div className="w-px h-6 bg-white/20" />
              </>
            )}

            {/* Quick stats */}
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-white/40 font-bold uppercase tracking-wider">Devices</span>
                <span className="text-white font-bold ml-2">{activeDevices.length}</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div>
                <span className="text-white/40 font-bold uppercase tracking-wider">Load</span>
                <span className="text-white font-bold ml-2">
                  {(activeDevices.reduce((acc, d) => acc + (d.power === 'ON' ? parseFloat(d.consumption || '0') : 0), 0)).toFixed(1)} kWh
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-white/20" />

            {/* Hint */}
            <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-medium">
              <Move3D size={14} />
              <span>Scroll to zoom • Drag to rotate</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT DRAWER: Devices (toggle) ──────────────────────────── */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="absolute top-1/2 -translate-y-1/2 right-0 z-30 w-8 h-20 bg-black/50 backdrop-blur-md border border-r-0 border-white/10 text-white/60 hover:text-white flex items-center justify-center rounded-l-xl transition-all pointer-events-auto hover:bg-black/70"
          title={rightPanelOpen ? "Close Devices" : "Open Devices"}
        >
          {rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`absolute top-4 right-0 bottom-4 w-[340px] z-20 transition-transform duration-300 ease-in-out ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="bg-black/50 backdrop-blur-xl p-5 rounded-l-[24px] border border-r-0 border-white/10 h-full flex flex-col overflow-hidden pointer-events-auto">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold tracking-widest uppercase text-white/50">Connected Devices</h3>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 ring-1 ring-green-400/20 px-2.5 py-1 rounded-md">
                {activeDevices.filter(d => d.status === 'Online').length} Online
              </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pb-4 pr-1 scroll-smooth flex-1">
              {activeDevices.map((device, idx) => (
                <DeviceCard
                  key={idx}
                  icon={device.icon}
                  name={device.name}
                  status={device.status}
                  power={device.power}
                  consumption={device.consumption}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Floating AI Button */}
        <button
          onClick={() => router.push('/ai-assistant')}
          className="absolute bottom-6 right-6 z-30 bg-gradient-to-r from-[#1428A0] to-[#2189FF] text-white pl-4 pr-5 py-3 rounded-full shadow-[0_8px_30px_rgba(33,137,255,0.4)] hover:shadow-[0_12px_40px_rgba(33,137,255,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-2.5 font-bold text-[13px] group ring-2 ring-white/20"
        >
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
            <Sparkles size={16} className="text-white fill-white" />
          </div>
          ASGUARD AI
        </button>
      </div>
    </AppLayout>
  )
}
