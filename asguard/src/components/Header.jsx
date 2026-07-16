'use client'

import { Bell, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'

export default function Header({ title, subtitle, titleExtra }) {
  const { currentUser, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async (e) => {
    e.stopPropagation()
    try {
      await logout()
      router.push('/login')
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  const getInitials = (name) => {
    if (!name) return "ST"
    const parts = name.split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <header className="h-24 px-6 lg:px-10 flex items-center justify-between shrink-0 bg-[#F7F9FC]/90 backdrop-blur-md z-20 sticky top-0">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
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
        <button 
          className="relative p-2.5 rounded-full text-gray-400 hover:text-[#1428A0] hover:bg-white hover:shadow-sm transition-all ring-1 ring-transparent hover:ring-gray-100"
          title="Notifications"
        >
          <Bell size={22} />
        </button>
        <div className="h-8 w-[1px] bg-gray-200 hidden sm:block" />
        
        {currentUser ? (
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push('/profile')}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 group-hover:text-[#1428A0] transition-colors leading-tight">
                {currentUser.name}
              </p>
              <p className="text-xs font-semibold text-gray-500">
                {currentUser.houseName || "Smart Home"}
              </p>
            </div>
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-white border border-gray-100"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
                {getInitials(currentUser.name)}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="text-sm font-bold text-[#1428A0] hover:text-[#2189FF] bg-white ring-1 ring-gray-200 px-4 py-2 rounded-xl transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}
