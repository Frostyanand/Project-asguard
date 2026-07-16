'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Video,
  Box,
  Bot,
  FlaskConical,
  Settings,
  BarChart3,
  RefreshCw,
  User,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',         path: '/dashboard',        icon: LayoutDashboard },
  { label: 'Scan Room',         path: '/upload',           icon: Video },
  { label: 'Digital Twin',      path: '/digital-twin',     icon: Box },
  { label: 'AI Assistant',      path: '/ai-assistant',     icon: Bot },
  { label: 'Automation Rules',  path: '/automation-rules', icon: RefreshCw },
  { label: 'Analytics',         path: '/analytics',        icon: BarChart3 },
  { label: 'Profile',           path: '/profile',          icon: User },
  { label: 'Simulation',        path: '/simulation',       icon: FlaskConical },
  { label: 'Settings',          path: '#settings',         icon: Settings },
]

function SidebarItem({ icon: Icon, label, active, onClick }) {
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
      <span className="text-sm">{label}</span>
    </button>
  )
}

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

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
          />
        ))}
      </div>

      {/* Hub Status */}
      <div className="p-6 border-t border-gray-100">
        <div className="bg-[#F7F9FC] rounded-2xl p-4 border border-gray-200/60 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <div>
            <p className="text-xs font-bold text-gray-900">Hub Online</p>
            <p className="text-[11px] font-semibold text-gray-500 mt-0.5">All systems operational</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
