'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulation } from '../../context/SimulationContext'
import { generateRecommendations } from '../../firebase/firestoreService'
import {
  Sparkles, MessageSquare, Thermometer, Power, Lightbulb,
  AlertTriangle, Send, TrendingDown, CheckCircle2, SlidersHorizontal,
  RefreshCw, FlaskConical, BarChart3, Bot, Loader2,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Rule-based query engine ────────────────────────────────────────────────────
// Completely deterministic — no LLM/AI involved.
// Takes the current simulation logs + pre-computed recommendations and returns
// a structured answer based on keyword matching in the user's query.

function answerQuery(query, sim, rec) {
  const q = query.toLowerCase()
  const logs  = sim?.currentLogs ?? []
  const hasData = logs.length > 1

  if (!hasData) {
    return {
      text: 'No simulation data is loaded yet. Please navigate to the **Simulation Engine** and press Play to start streaming energy data. Once data is available, I can answer questions about your usage, costs, and appliances.',
      metrics: null,
    }
  }

  // ── Active devices ─────────────────────────────────────────────────────────
  if (q.includes('active') || q.includes('online') || q.includes('on') || q.includes('running')) {
    const latestByDevice = {}
    for (const l of logs) {
      if (!latestByDevice[l.applianceId] || l.timestamp > latestByDevice[l.applianceId].timestamp) {
        latestByDevice[l.applianceId] = l
      }
    }
    const active = Object.values(latestByDevice).filter(l => l.status === 'ON')
    return {
      text: `As of the current simulation time, **${active.length} device${active.length !== 1 ? 's' : ''}** are active:\n${active.map(l => `• **${l.appliance?.name || l.applianceId}** (${l.roomName || l.roomId})`).join('\n')}`,
      metrics: { label: 'Active Devices', value: active.length.toString() },
    }
  }

  // ── Highest consuming appliance ───────────────────────────────────────────
  if (q.includes('highest') || q.includes('most') || q.includes('top') || q.includes('biggest') || q.includes('largest') || q.includes('consumes')) {
    const deviceMap = {}
    for (const l of logs) {
      const id = l.applianceId; const kwh = Number(l.energyKwh) || 0
      if (!deviceMap[id]) deviceMap[id] = { name: l.appliance?.name || id, kwh: 0 }
      deviceMap[id].kwh += kwh
    }
    const top3 = Object.values(deviceMap).sort((a, b) => b.kwh - a.kwh).slice(0, 3)
    const totalKwh = Object.values(deviceMap).reduce((s, d) => s + d.kwh, 0)
    const top = top3[0]
    const pct = totalKwh > 0 ? ((top.kwh / totalKwh) * 100).toFixed(1) : 0
    return {
      text: `Your highest-consuming appliance so far is **${top.name}** with **${top.kwh.toFixed(2)} kWh** consumed (${pct}% of total).\n\nTop 3:\n${top3.map((d, i) => `${i + 1}. **${d.name}** — ${d.kwh.toFixed(2)} kWh`).join('\n')}`,
      metrics: { label: 'Top Appliance', value: top.name, sub: `${top.kwh.toFixed(2)} kWh` },
    }
  }

  // ── Cost / bill ────────────────────────────────────────────────────────────
  if (q.includes('cost') || q.includes('bill') || q.includes('money') || q.includes('spend') || q.includes('rupee') || q.includes('₹') || q.includes('saving')) {
    const totalCost = logs.reduce((s, l) => s + (Number(l.electricityCost) || 0), 0)
    const vDate = new Date(sim.virtualTime)
    const startOfMonth = new Date(Date.UTC(vDate.getUTCFullYear(), vDate.getUTCMonth(), 1)).getTime()
    const daysElapsed = Math.max(1/24, (sim.virtualTime - startOfMonth) / 86400000)
    const projected = (totalCost / daysElapsed) * 30
    const saving = rec?.estimatedMonthlySaving ?? 0
    return {
      text: `**Cost incurred so far:** ₹${totalCost.toFixed(0)}\n**Projected monthly bill:** ₹${projected.toFixed(0)}\n**Potential monthly saving:** ₹${saving}\n\nThe largest contributor to your bill is your AC units. Running the ACs 1 hour less per night can save approximately ₹${(saving * 0.4).toFixed(0)}/month.`,
      metrics: { label: 'Projected Monthly', value: `₹${projected.toFixed(0)}`, sub: `₹${saving} savable` },
    }
  }

  // ── Carbon / environment ───────────────────────────────────────────────────
  if (q.includes('carbon') || q.includes('emission') || q.includes('environment') || q.includes('green') || q.includes('eco')) {
    const totalKwh = logs.reduce((s, l) => s + (Number(l.energyKwh) || 0), 0)
    const carbon = totalKwh * 0.82
    return {
      text: `Your home has emitted **${carbon.toFixed(1)} kg of CO₂** so far in this simulation period.\n\nIndia's grid emission factor is **0.82 kg CO₂ per kWh** (CEA 2024). Your current consumption rate of **${totalKwh.toFixed(1)} kWh** translates to this footprint.\n\nSwitching your ACs to Eco Mode (target temp 26°C) can reduce carbon output by ~20-30%.`,
      metrics: { label: 'CO₂ Emitted', value: `${carbon.toFixed(1)} kg` },
    }
  }

  // ── Reduce bill / savings ──────────────────────────────────────────────────
  if (q.includes('reduce') || q.includes('save') || q.includes('improve') || q.includes('efficient') || q.includes('optimis') || q.includes('less')) {
    const saving = rec?.estimatedMonthlySaving ?? 0
    const mainRec = rec?.mainRecommendation
    return {
      text: `Here are the top recommendations to reduce your energy costs:\n\n1. **${mainRec?.applianceName || 'Air Conditioner'}** — ${mainRec?.actionText || 'Set to 26°C and use a timer to auto-off after midnight.'}\n2. **Schedule high-wattage appliances** — Use the Automation Rules page to shift induction cooktop and water heater to off-peak hours (10 PM–6 AM).\n3. **Enable Eco Mode** — In Agentic Policies, switch to Eco Mode to automatically cap AC runtime.\n\nEstimated potential saving: **₹${saving}/month**.`,
      metrics: { label: 'Potential Saving', value: `₹${saving}/month` },
    }
  }

  // ── Anomalies / alerts ────────────────────────────────────────────────────
  if (q.includes('anomal') || q.includes('alert') || q.includes('warning') || q.includes('unusual') || q.includes('spike')) {
    const anomalies = logs.filter(l => l.aiFlag && l.aiFlag !== 'Normal')
    const byDevice = {}
    for (const a of anomalies) {
      const id = a.applianceId
      if (!byDevice[id]) byDevice[id] = { name: a.appliance?.name || id, count: 0 }
      byDevice[id].count++
    }
    const topAnomaly = Object.values(byDevice).sort((a, b) => b.count - a.count)[0]
    return {
      text: `**${anomalies.length} anomaly events** detected so far in this simulation period.\n\n${topAnomaly ? `The most frequent anomalies are from **${topAnomaly.name}** (${topAnomaly.count} events).\n\n` : ''}You can review and configure anomaly thresholds in the **Agentic Policies** page under the Alerts tab.`,
      metrics: { label: 'Anomaly Events', value: anomalies.length.toString() },
    }
  }

  // ── Room breakdown ─────────────────────────────────────────────────────────
  if (q.includes('room') || q.includes('bedroom') || q.includes('kitchen') || q.includes('living') || q.includes('bathroom')) {
    const roomMap = {}
    for (const l of logs) {
      const rn = l.roomName || l.roomId || 'Unknown'
      if (!roomMap[rn]) roomMap[rn] = 0
      roomMap[rn] += Number(l.energyKwh) || 0
    }
    const sorted = Object.entries(roomMap).sort(([, a], [, b]) => b - a)
    return {
      text: `**Energy consumption by room** (accumulated so far):\n\n${sorted.map(([room, kwh], i) => `${i + 1}. **${room}** — ${kwh.toFixed(2)} kWh`).join('\n')}`,
      metrics: { label: 'Top Room', value: sorted[0]?.[0] || '—', sub: `${sorted[0]?.[1]?.toFixed(2)} kWh` },
    }
  }

  // ── Default: show general summary ─────────────────────────────────────────
  const totalKwh  = logs.reduce((s, l) => s + (Number(l.energyKwh) || 0), 0)
  const totalCost = logs.reduce((s, l) => s + (Number(l.electricityCost) || 0), 0)
  const anomCount = logs.filter(l => l.aiFlag && l.aiFlag !== 'Normal').length
  return {
    text: `Here's a summary of your current energy status:\n\n• **Energy consumed:** ${totalKwh.toFixed(2)} kWh\n• **Cost incurred:** ₹${totalCost.toFixed(0)}\n• **Anomaly events:** ${anomCount}\n• **Records analysed:** ${logs.length.toLocaleString()}\n\nYou can ask me about: highest-consuming appliances, room-wise breakdown, cost projections, carbon footprint, savings opportunities, or active devices.`,
    metrics: null,
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function UserBubble({ text }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 pr-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">You</span>
      </div>
      <div className="bg-[#F7F9FC] ring-1 ring-gray-200/80 text-gray-900 rounded-[24px] rounded-tr-[8px] px-6 py-4 max-w-[80%] shadow-sm">
        <p className="text-[15px] font-semibold leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

function AIBubble({ text, metrics, loading }) {
  // Convert **bold** markers to JSX
  const renderText = (t) => t.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <p key={i} className="text-[15px] font-medium leading-relaxed text-gray-700 mb-1">
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="text-gray-900 font-bold">{p.slice(2, -2)}</strong>
            : p
        )}
      </p>
    )
  })

  return (
    <div className="flex flex-col items-start gap-3 w-full">
      <div className="flex items-center gap-3 ml-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center shadow-md">
          <Bot size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[13px] font-extrabold text-[#1428A0] tracking-wide">ASGUARD</span>
      </div>
      <div className="bg-white ring-1 ring-blue-100/50 text-gray-800 rounded-[32px] rounded-tl-[10px] p-7 w-full shadow-sm">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 size={18} className="animate-spin text-[#1428A0]" />
            <span className="text-sm font-semibold">Analysing your energy data…</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div>{renderText(text)}</div>
            {metrics && (
              <div className="bg-gradient-to-r from-[#F4F7FB] to-white border border-gray-100/80 rounded-2xl p-5 flex flex-wrap items-center gap-6 mt-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{metrics.label}</p>
                  <p className="text-[28px] font-extrabold text-[#1428A0] tracking-tight leading-none">{metrics.value}</p>
                  {metrics.sub && <p className="text-xs text-gray-500 font-semibold mt-1">{metrics.sub}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  'How can I reduce my electricity bill?',
  'Which appliance consumes the most energy?',
  'Which room uses the most electricity?',
  'How many devices are currently active?',
  'What are my anomaly alerts?',
  'What is my carbon footprint?',
  'What are my projected monthly costs?',
]

export default function AIAssistant() {
  const router = useRouter()
  const sim = useSimulation()

  const [messages, setMessages] = useState([])  // { role: 'user'|'assistant', text, metrics }
  const [input,    setInput]    = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)

  // Pre-compute recommendations once (updated when logs change)
  const rec = useMemo(
    () => generateRecommendations(sim?.currentLogs ?? []),
    [sim?.currentLogs?.length]
  )

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return
    const userText = text.trim()
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setInput('')
    setThinking(true)

    // Simulate a brief thinking delay (rule engine is instant, but UX feels more natural)
    setTimeout(() => {
      const answer = answerQuery(userText, sim, rec)
      setMessages(prev => [...prev, { role: 'assistant', text: answer.text, metrics: answer.metrics }])
      setThinking(false)
    }, 600)
  }, [sim, rec])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const sparklesBadge = (
    <div className="bg-gradient-to-r from-[#1428A0] to-[#2189FF] text-white p-1.5 rounded-lg shadow-sm">
      <Sparkles size={16} strokeWidth={2.5} />
    </div>
  )

  const hasData = (sim?.currentLogs?.length ?? 0) > 1

  return (
    <AppLayout>
      <Header
        title="Energy Assistant"
        titleExtra={sparklesBadge}
        subtitle="Ask questions about your home's energy — answers are rule-based, derived from your simulation data."
      />

      <div className="flex-1 flex gap-6 lg:gap-8 px-10 pb-10 overflow-hidden min-h-0">

        {/* LEFT: Suggested Questions */}
        <div className="w-[220px] lg:w-[240px] flex flex-col shrink-0 h-full z-20">
          <h3 className="text-[12px] font-bold tracking-widest uppercase text-gray-400 mb-5 ml-1">Suggested Questions</h3>
          <div className="flex flex-col gap-3 overflow-y-auto pb-4 pr-2 scroll-smooth">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(q)}
                className="w-full bg-white rounded-[16px] p-4 premium-shadow ring-1 ring-gray-100/60 hover:ring-[#2189FF]/30 hover:shadow-md transition-all duration-300 text-left group flex items-start gap-3 active:scale-[0.98]"
              >
                <MessageSquare size={16} className="text-[#2189FF] shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                <span className="text-[13px] font-bold text-gray-700 group-hover:text-gray-900 leading-snug">{q}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER: Chat */}
        <div className="flex-1 flex flex-col h-full min-w-0 z-10">
          <div className="flex-1 bg-white rounded-[32px] premium-shadow ring-1 ring-gray-100/60 overflow-hidden flex flex-col min-h-0">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-10 flex flex-col gap-8 scroll-smooth">

              {/* Welcome message */}
              {messages.length === 0 && (
                <AIBubble
                  text={hasData
                    ? `Hello! I'm ASGUARD, your energy monitoring assistant. I can answer questions about your home's energy usage, costs, appliances, and carbon footprint — all derived from your live simulation data.\n\nTry asking: **"Which appliance uses the most energy?"** or **"How can I reduce my bill?"**`
                    : `Hello! I'm ASGUARD, your energy monitoring assistant.\n\nNo simulation data is loaded yet. Please go to the **Simulation Engine** page and press **Play** to start streaming energy data. Once data is available, I can answer all your questions about usage, costs, and appliances.`
                  }
                  metrics={null}
                  loading={false}
                />
              )}

              {messages.map((msg, idx) =>
                msg.role === 'user'
                  ? <UserBubble key={idx} text={msg.text} />
                  : <AIBubble key={idx} text={msg.text} metrics={msg.metrics} loading={false} />
              )}

              {thinking && <AIBubble text="" metrics={null} loading={true} />}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-6 lg:p-8 bg-white border-t border-gray-100/80 shrink-0">
              <div className="relative flex items-center bg-[#F7F9FC] rounded-[24px] ring-1 ring-gray-200/80 focus-within:ring-2 focus-within:ring-[#2189FF] focus-within:bg-white transition-all shadow-sm group">
                <div className="pl-7 pr-3 text-gray-400 group-focus-within:text-[#2189FF] transition-colors">
                  <Sparkles size={22} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={hasData ? 'Ask about your energy usage…' : 'Load simulation data first…'}
                  className="flex-1 bg-transparent py-4 outline-none text-[15px] text-gray-900 font-semibold placeholder:text-gray-400 placeholder:font-medium"
                />
                <div className="pr-3.5 pl-3">
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || thinking}
                    className="w-12 h-12 rounded-[18px] bg-[#1428A0] text-white flex items-center justify-center hover:bg-[#102080] transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={18} strokeWidth={2.5} className="mr-0.5 mt-0.5" />
                  </button>
                </div>
              </div>
              <p className="text-center text-[11px] font-bold text-gray-400 mt-4 tracking-wide">
                Answers are rule-based and derived from your energy simulation data — not AI-generated.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Quick Actions */}
        <div className="w-[200px] lg:w-[220px] flex flex-col shrink-0 h-full z-20">
          <h3 className="text-[12px] font-bold tracking-widest uppercase text-gray-400 mb-5 ml-1">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            {[
              { icon: SlidersHorizontal, label: 'Set Policies',      path: '/automation-rules', primary: true },
              { icon: RefreshCw,         label: 'Configure Rules',   path: '/automation-rules' },
              { icon: FlaskConical,      label: 'Run Simulation',    path: '/simulation' },
              { icon: BarChart3,         label: 'View Analytics',    path: '/analytics' },
            ].map(({ icon: Icon, label, path, primary }) => (
              <button
                key={path + label}
                onClick={() => router.push(path)}
                className={`w-full px-4 py-3.5 rounded-[14px] font-bold text-[13px] transition-all flex items-center gap-2 active:scale-[0.98] text-left ${
                  primary
                    ? 'bg-[#1428A0] text-white hover:bg-[#102080] shadow-[0_4px_14px_rgba(20,40,160,0.25)]'
                    : 'bg-white border border-gray-100 text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <Icon size={16} strokeWidth={2.5} className={primary ? 'text-blue-200' : 'text-gray-400'} />
                {label}
              </button>
            ))}
          </div>

          {/* Live data status */}
          {hasData && (
            <div className="mt-auto pt-6">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-green-700">Data Active</p>
                  <p className="text-[11px] text-green-600 font-semibold mt-0.5">{(sim?.currentLogs?.length ?? 0).toLocaleString()} records</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  )
}
