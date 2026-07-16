'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useSimulation } from '../context/SimulationContext'
import {
  LayoutDashboard,
  Video,
  Box,
  Bot,
  FlaskConical,
  BarChart3,
  ShieldCheck,
  WifiOff,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',        path: '/dashboard',        icon: LayoutDashboard },
  { label: 'Scan Room',        path: '/upload',           icon: Video },
  { label: 'Digital Twin',     path: '/digital-twin',     icon: Box },
  { label: 'AI Assistant',     path: '/ai-assistant',     icon: Bot },
  { label: 'Agentic Policies', path: '/automation-rules', icon: ShieldCheck, policyBadge: true },
  { label: 'Analytics',        path: '/analytics',        icon: BarChart3 },
  { label: 'Simulation',       path: '/simulation',       icon: FlaskConical },
]

function SidebarItem({ icon: Icon, label, active, onClick, badge }) {
  return (
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
      <span className="text-sm flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-extrabold shadow-sm">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const sim      = useSimulation()

  const criticalAlerts = sim?.policyEngineSummary?.criticalAlerts ?? 0
  const isLoaded = (sim?.allLogs?.length ?? 0) > 0
  const isLive   = isLoaded && sim?.isPlaying

  return (
    <aside className="hidden lg:flex w-[280px] bg-white border-r border-gray-200/60 flex-col shrink-0 z-30">
      {/* Logo */}
      <div className="h-24 px-8 flex items-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#1428A0] text-white flex items-center justify-center shadow-md">
            <Box size={18} strokeWidth={2.5} />
          </span>
          ASGUARD
        </h1>
      </div>

      {/* Nav Items */}
      <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={pathname === item.path}
            onClick={() => router.push(item.path)}
            badge={item.policyBadge ? criticalAlerts : null}
          />
        ))}
      </div>

      {/* Data Pipeline Status — derived from SimulationContext */}
      <div className="p-6 border-t border-gray-100">
        <div className="bg-[#F7F9FC] rounded-2xl p-4 border border-gray-200/60 flex items-center gap-3">
          {sim?.isLoading ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-gray-900">Loading Dataset</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Fetching from Neon DB…</p>
              </div>
            </>
          ) : !isLoaded ? (
            <>
              <WifiOff size={14} className="text-red-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-600">No Data Loaded</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Open Simulation to load</p>
              </div>
            </>
          ) : isLive ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">Simulation Running</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{(sim.allLogs.length).toLocaleString()} records loaded</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">Dataset Ready</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{(sim.allLogs.length).toLocaleString()} records · Paused</p>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
