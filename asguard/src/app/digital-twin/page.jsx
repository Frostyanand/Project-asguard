'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useSimulation } from '../../context/SimulationContext'
import { getLatestSimulatedStates } from '../../services/simulationMetrics'
import {
  fetchUserProfile,
  getUniqueRooms,
  getRoomIcon,
  getApplianceIcon,
} from '../../firebase/firestoreService'
import {
  Wind, Tv, Lightbulb, Blinds, Fan, Refrigerator, Flame,
  Sofa, Bed, Utensils, Bath, Home,
  RotateCcw, LocateFixed, Sparkles, Activity,
  ChevronLeft, ChevronRight, Eye, EyeOff, Move3D, Loader2, AlertTriangle,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'
import { useProgress } from '@react-three/drei'
import dynamic from "next/dynamic"

const Scene = dynamic(
  () => import("./components/Scene"),
  { ssr: false }
)

// ── Icon maps ──────────────────────────────────────────────────────────────────

const ROOM_ICON_MAP = {
  Sofa, Bed, Utensils, Bath, Home,
}

const APPLIANCE_ICON_MAP = {
  Wind, Tv, Lightbulb, Blinds, Fan, Refrigerator, Flame, Zap: Activity,
}

function resolveRoomIcon(roomType) {
  const name = getRoomIcon(roomType)
  return ROOM_ICON_MAP[name] || Home
}

function resolveApplianceIcon(applianceType) {
  const name = getApplianceIcon(applianceType)
  return APPLIANCE_ICON_MAP[name] || Activity
}

// ── Page-local Sub-components ─────────────────────────────────────────────────

function TwinLoader() {
  const { progress } = useProgress()
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => setShow(false), 800)
      return () => clearTimeout(timeout)
    }
  }, [progress])

  if (!show) return null

  return (
    <div
      className={`absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0e1a] to-[#111827] transition-opacity duration-1000 ease-in-out ${
        progress === 100 ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      <div className="relative flex flex-col items-center scale-90 sm:scale-100">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-[3px] border-[#1428A0]/30 rounded-full"></div>
          <div
            className="absolute inset-0 border-[3px] border-[#2189FF] rounded-full border-t-transparent animate-spin"
            style={{ animationDuration: '1.2s' }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-sm font-bold tracking-wider">{Math.round(progress)}%</span>
          </div>
        </div>
        <h2 className="text-white font-bold tracking-widest text-sm sm:text-base uppercase mb-4">
          Loading Digital Twin...
        </h2>
        <div className="w-56 h-1 bg-white/10 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#1428A0] to-[#2189FF] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(33,137,255,0.5)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

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
              <div className={`w-2 h-2 rounded-full ${status === 'ON' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{status === 'ON' ? 'Online' : 'Offline'}</span>
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
      {consumption != null && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100/80 mt-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total Consumption</span>
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
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [viewMode, setViewMode] = useState('isometric')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [roomList, setRoomList] = useState([])
  const [devicesData, setDevicesData] = useState({ all: [] })
  const [roomNamesMap, setRoomNamesMap] = useState({ all: 'Entire Apartment' })

  const router = useRouter()
  const { currentUser, loading: authLoading } = useAuth()
  const sim = useSimulation()

  // Auto-traverse: when a specific room is selected, go interior. When 'all', go aerial.
  useEffect(() => {
    if (activeRoom === 'all') {
      setViewMode('isometric')
    } else {
      setViewMode('interior')
    }
  }, [activeRoom])

  const previousTwinStateRef = useRef("");

  // Derive Twin State from Simulation Engine
  useEffect(() => {
    if (!sim || sim.isLoading || authLoading) return;
    setLoading(false);
    
    if (sim.currentLogs.length === 0) {
      const emptyState = "EMPTY";
      if (previousTwinStateRef.current !== emptyState) {
        setRoomList([{ id: 'all', label: 'Entire Apartment', letter: 'ALL', icon: Home }])
        setDevicesData({ all: [] })
        setRoomNamesMap({ all: 'Entire Apartment' })
        previousTwinStateRef.current = emptyState;
      }
      return
    }

    try {
      const latestLogs = getLatestSimulatedStates(sim.currentLogs);
      
      if (latestLogs.length === 0) return;

      const twinStateStr = JSON.stringify(latestLogs);
      if (previousTwinStateRef.current === twinStateStr) {
        // No devices changed state. Skip heavy React re-render.
        return;
      }
      previousTwinStateRef.current = twinStateStr;

      const uniqueRooms = getUniqueRooms(latestLogs)
      const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

      const namesMap = { all: 'Entire Apartment' }
      const builtRoomList = [
        { id: 'all', label: 'Entire Apartment', letter: 'ALL', icon: Home }
      ]

      uniqueRooms.forEach((room, index) => {
        const letter = LETTERS[index] || String.fromCharCode(65 + index)
        namesMap[letter] = room.roomName
        builtRoomList.push({
          id: letter,
          label: room.roomName,
          letter,
          icon: resolveRoomIcon(room.roomType),
        })
      })

      const builtDevicesData = { all: [] }
      for (const letter of Object.keys(namesMap)) {
        if (letter !== 'all') builtDevicesData[letter] = []
      }

      for (const log of latestLogs) {
        const DevIcon = resolveApplianceIcon(log.appliance_type)
        const kwh = Number(log.energy_kwh) || 0
        const deviceEntry = {
          icon: DevIcon,
          name: log.appliance_name || log.appliance_id || 'Unknown Device',
          status: log.status === 'ON' ? 'ON' : 'OFF',
          power: log.status === 'ON' ? 'ON' : 'OFF',
          consumption: kwh > 0 ? `${kwh.toFixed(2)} kWh` : null,
        }

        builtDevicesData.all.push(deviceEntry)

        const roomEntry = uniqueRooms.findIndex((r) => r.roomName === log.room_name)
        if (roomEntry !== -1) {
          const letter = LETTERS[roomEntry] || String.fromCharCode(65 + roomEntry)
          if (builtDevicesData[letter]) {
            builtDevicesData[letter].push(deviceEntry)
          }
        }
      }

      setRoomNamesMap(namesMap)
      setRoomList(builtRoomList)
      setDevicesData(builtDevicesData)
      
    } catch (err) {
      console.error(err)
      setError(err.message)
    }

  }, [sim?.virtualTime, sim?.currentLogs, sim?.isLoading, authLoading])

  const activeDevices = devicesData[activeRoom] || devicesData.all || []

  return (
    <AppLayout>
      {/* Full-screen immersive container */}
      <div className="flex-1 relative w-full h-full overflow-hidden select-none">

        {/* 3D Viewer fills entire viewport */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] to-[#111827]">
          <TwinLoader />
          {!loading && (
            <Scene
              activeRoom={activeRoom === 'all' ? null : activeRoom}
              setActiveRoom={setActiveRoom}
              ceilingVisible={ceilingVisible}
              focusMode={focusMode}
              roomCenters={roomCenters}
              setRoomCenters={setRoomCenters}
              viewMode={viewMode}
            />
          )}
        </div>

        {/* ── TOP BAR ────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4 pointer-events-auto">
              <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/90 font-bold text-sm tracking-tight">AEGIS Digital Twin</span>
                <span className="text-white/40 text-xs">•</span>
                <span className="text-white/50 text-xs font-medium">{roomNamesMap[activeRoom] || 'Entire Apartment'}</span>
              </div>
              {error && (
                <div className="bg-amber-500/80 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-400/30 flex items-center gap-2 text-white text-xs font-bold">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setCeilingVisible(!ceilingVisible)}
                className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${ceilingVisible ? 'bg-[#1428A0]/80 border-[#1428A0]/50 text-white' : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/60'}`}
                title={ceilingVisible ? "Hide Ceiling" : "Show Ceiling"}
              >
                {ceilingVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`p-2.5 rounded-xl backdrop-blur-md border transition-all ${focusMode ? 'bg-[#1428A0]/80 border-[#1428A0]/50 text-white' : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/60'}`}
                title={focusMode ? "Disable Focus" : "Enable Focus"}
              >
                <LocateFixed size={18} />
              </button>
              <button
                onClick={() => {
                  setActiveRoom('all')
                  setCeilingVisible(false)
                  setFocusMode(true)
                }}
                className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-black/60 transition-all"
                title="Reset View"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── LEFT EDGE: Room selector ──────────────────────────── */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
          {loading ? (
            <div className="bg-black/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-2 text-white/60">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-bold">Loading...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {roomList.map((room) => {
                const isActive = activeRoom === room.id
                const Icon = room.icon
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
                )
              })}
            </div>
          )}
        </div>

        {/* ── BOTTOM CENTER: Perspective toggle + info ─────────────────── */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="bg-black/50 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
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
                  {activeDevices
                    .filter(d => d.power === 'ON')
                    .reduce((acc, d) => acc + parseFloat(d.consumption || '0'), 0)
                    .toFixed(1)} kWh
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-white/20" />

            <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-medium">
              <Move3D size={14} />
              <span>Scroll to zoom • Drag to rotate</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT DRAWER: Devices ──────────────────────────── */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="absolute top-1/2 -translate-y-1/2 right-0 z-30 w-8 h-20 bg-black/50 backdrop-blur-md border border-r-0 border-white/10 text-white/60 hover:text-white flex items-center justify-center rounded-l-xl transition-all pointer-events-auto hover:bg-black/70"
          title={rightPanelOpen ? "Close Devices" : "Open Devices"}
        >
          {rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`absolute top-4 right-0 bottom-32 w-[340px] z-20 transition-transform duration-300 ease-in-out ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="bg-black/50 backdrop-blur-xl p-5 rounded-l-[24px] border border-r-0 border-white/10 h-full flex flex-col overflow-hidden pointer-events-auto">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold tracking-widest uppercase text-white/50">Connected Devices</h3>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 ring-1 ring-green-400/20 px-2.5 py-1 rounded-md">
                {activeDevices.filter(d => d.status === 'ON').length} Online
              </span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pb-4 pr-1 scroll-smooth flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-white/40">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm font-semibold">Loading devices...</span>
                </div>
              ) : activeDevices.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-white/40 text-sm font-semibold">
                  No devices found.
                </div>
              ) : (
                activeDevices.map((device, idx) => (
                  <DeviceCard
                    key={idx}
                    icon={device.icon}
                    name={device.name}
                    status={device.status}
                    power={device.power}
                    consumption={device.consumption}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Floating AI Button */}
        <button
          onClick={() => router.push('/ai-assistant')}
          className="absolute bottom-32 right-6 z-30 bg-gradient-to-r from-[#1428A0] to-[#2189FF] text-white pl-4 pr-5 py-3 rounded-full shadow-[0_8px_30px_rgba(33,137,255,0.4)] hover:shadow-[0_12px_40px_rgba(33,137,255,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-2.5 font-bold text-[13px] group ring-2 ring-white/20"
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
