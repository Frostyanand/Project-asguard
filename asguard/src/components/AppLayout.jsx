'use client'

import Sidebar from './Sidebar'

/**
 * AppLayout wraps all authenticated pages with the shared Sidebar.
 * Each page manages its own Header and scrollable content area.
 * Replaces the old Layout + <Outlet /> pattern from react-router-dom.
 */
export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen w-full bg-[#F7F9FC] text-gray-900 overflow-hidden selection:bg-[#2189FF]/20">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {children}
      </main>
    </div>
  )
}
