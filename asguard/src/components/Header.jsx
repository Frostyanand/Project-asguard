'use client'

import { Bell, LayoutDashboard } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Header({ title, subtitle, titleExtra }) {
  const router = useRouter()
  return (
    <header className="h-24 px-6 lg:px-10 flex items-center justify-between shrink-0 bg-[#F7F9FC]/90 backdrop-blur-md z-20 sticky top-0">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger (placeholder – can hook into mobile drawer later) */}
        <button className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
          <LayoutDashboard size={24} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl lg:text-[26px] font-bold text-gray-900 tracking-tight">{title}</h2>
            {titleExtra}
          </div>
          {subtitle && (
            <p className="text-sm font-medium text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-4 lg:gap-6">
        <button className="relative p-2.5 rounded-full text-gray-400 hover:text-[#1428A0] hover:bg-white hover:shadow-sm transition-all ring-1 ring-transparent hover:ring-gray-100">
          <Bell size={22} />
        </button>
        <div className="h-8 w-[1px] bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/profile')}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 group-hover:text-[#1428A0] transition-colors">J. Doe</p>
            <p className="text-xs font-semibold text-gray-500">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
            JD
          </div>
        </div>
      </div>
    </header>
  )
}
