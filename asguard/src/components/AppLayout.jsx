'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'
import Sidebar from './Sidebar'

/**
 * AppLayout wraps all authenticated pages with the shared Sidebar & Route Guard.
 * If the user is unauthenticated, it automatically redirects them to /login.
 * Note: SimulationPlayer is rendered directly inside /simulation page, not globally.
 */
export default function AppLayout({ children }) {
  const router = useRouter()
  const { currentUser, loading } = useAuth()

  useEffect(() => {
    if (!loading && !currentUser) {
      console.log("[Route Guard] Unauthenticated access detected. Redirecting to /login...");
      router.push('/login')
    }
  }, [currentUser, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={36} className="animate-spin text-[#1428A0]" />
          <p className="text-sm font-semibold">Verifying session security...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="flex h-screen w-full bg-[#F7F9FC] text-gray-900 overflow-hidden selection:bg-[#2189FF]/20">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {children}
      </main>
    </div>
  )
}
