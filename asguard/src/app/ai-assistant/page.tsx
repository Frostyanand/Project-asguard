'use client'

import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'
import Chat from '../../components/Chat'
import { Sparkles } from 'lucide-react'

export default function AIAssistant() {
  const sparklesBadge = (
    <div className="bg-gradient-to-r from-[#1428A0] to-[#2189FF] text-white p-1.5 rounded-lg shadow-sm">
      <Sparkles size={16} strokeWidth={2.5} />
    </div>
  )

  return (
    <AppLayout>
      <Header
        title="AI Energy Assistant"
        titleExtra={sparklesBadge}
        subtitle="Ask ASGUARD anything about your database schema and energy telemetry."
      />
      <div className="flex-1 flex flex-col min-h-0">
        <Chat />
      </div>
    </AppLayout>
  )
}
