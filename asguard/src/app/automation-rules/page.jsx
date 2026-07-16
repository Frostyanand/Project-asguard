'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useSimulation } from '../../context/SimulationContext'
import { deriveSimulationLogs } from '../../services/simulationMetrics'
import { DEFAULT_POLICIES } from '../../services/policyEngine'
import {
  ShieldCheck, Zap, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Bot, Play, Pause, Settings2, ToggleLeft, ToggleRight,
  IndianRupee, Leaf, Clock, Cpu, CheckCircle2, XCircle,
  Sun, Moon, Plane, Sliders, Info, ChevronRight, Loader2,
  BellRing, Power, Wind, Thermometer, Tv, Shirt, Flame,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Helpers ────────────────────────────────────────────────────────────────────

const AUTONOMY_LEVELS = [
  {
    id: 'monitor',
    label: 'Monitor Only',
    description: 'Agent watches and logs events. No automated actions taken.',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    ring: 'ring-gray-300',
    dot: 'bg-gray-400',
  },
  {
    id: 'copilot',
    label: 'Co-Pilot',
    description: 'Agent warns you of policy violations and suggests actions.',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    ring: 'ring-blue-300',
    dot: 'bg-[#2189FF]',
  },
  {
    id: 'autonomous',
    label: 'Fully Autonomous',
    description: 'Agent enforces all active policies automatically.',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    ring: 'ring-purple-300',
    dot: 'bg-purple-500',
  },
]

const MODES = [
  { id: 'normal', label: 'Normal', icon: Activity, description: 'Standard operation with anomaly monitoring.' },
  { id: 'eco', label: 'Eco Mode', icon: Leaf, description: 'Cap AC usage. Reduce phantom loads. Minimise carbon.' },
  { id: 'comfort', label: 'Comfort', icon: Sun, description: 'Prioritise comfort. Relax energy limits.' },
  { id: 'vacation', label: 'Vacation', icon: Plane, description: 'Shut down all non-essential devices.' },
  { id: 'custom', label: 'Custom', icon: Sliders, description: 'Fine-tune individual appliance policies.' },
]

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500', icon: AlertTriangle },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', icon: BellRing },
  info:     { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-[#2189FF]', icon: Info },
}

function SummaryCard({ title, value, sub, icon: Icon, iconBg, iconColor, highlight }) {
  return (
    <div className={`bg-white rounded-[24px] p-6 lg:p-7 premium-shadow ring-1 ${highlight ? 'ring-red-200' : 'ring-gray-100/60'} flex flex-col justify-between h-full group hover:ring-[#2189FF]/20 transition-all duration-300`}>
      <div className="flex justify-between items-start mb-5">
        <div className={`w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon size={22} className={iconColor} strokeWidth={2.5} />
        </div>
        {highlight && (
          <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-full ring-1 ring-red-200 uppercase tracking-wider">Alert</span>
        )}
      </div>
      <div>
        <h4 className="text-[26px] lg:text-[30px] font-extrabold text-gray-900 tracking-tight leading-none mb-2">{value}</h4>
        <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400">{title}</p>
        {sub && <p className="text-xs font-semibold text-gray-500 mt-1.5">{sub}</p>}
      </div>
    </div>
  )
}

function BudgetGauge({ label, current, projected, limit, unit, color }) {
  if (!limit || limit <= 0) return null
  const currentPct = Math.min(100, Math.round((current / limit) * 100))
  const projectedPct = Math.min(100, Math.round((projected / limit) * 100))
  const isOverBudget = projectedPct > 100
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <span className={`text-sm font-extrabold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
          {current.toFixed(1)} / {limit} {unit}
        </span>
      </div>
      <div className="relative h-4 bg-gray-100 rounded-full overflow-visible">
        {/* Current usage bar */}
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${currentPct}%` }}
        />
        {/* Projected marker */}
        {projectedPct > currentPct && projectedPct <= 105 && (
          <div
            className="absolute top-[-4px] h-[calc(100%+8px)] w-0.5 bg-orange-400 rounded-full"
            style={{ left: `${Math.min(100, projectedPct)}%` }}
            title={`Projected: ${projectedPct}%`}
          />
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
        <span>Current: {currentPct}%</span>
        <span className={isOverBudget ? 'text-red-500' : 'text-orange-500'}>
          Projected: {projectedPct}% {isOverBudget ? '⚠ OVER' : ''}
        </span>
      </div>
    </div>
  )
}

function PolicyToggle({ label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-[16px] bg-[#F7F9FC] border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex-1 mr-4">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-300 focus:outline-none ${enabled ? 'bg-[#1428A0]' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 mt-0.5 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function AgentActionFeed({ actions }) {
  const feedRef = useRef(null)
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [actions.length])

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <ShieldCheck size={36} strokeWidth={1.5} className="mb-3 text-gray-200" />
        <p className="text-sm font-semibold">No agent actions yet.</p>
        <p className="text-xs font-medium mt-1">Play the simulation to see the engine in action.</p>
      </div>
    )
  }

  return (
    <div ref={feedRef} className="flex flex-col gap-2.5 h-72 overflow-y-auto pr-1 scroll-smooth">
      {actions.map((action, idx) => {
        const cfg = SEVERITY_CONFIG[action.severity] || SEVERITY_CONFIG.info
        const CfgIcon = cfg.icon
        const timeStr = action.virtualDate || '—'
        return (
          <div key={idx} className={`flex items-start gap-3 p-3.5 rounded-[14px] border ${cfg.bg} ${cfg.border} transition-all`}>
            <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5 border ${cfg.border}`}>
              <CfgIcon size={14} className={cfg.text} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${cfg.text}`}>{action.type.replace(/_/g, ' ')}</span>
                <span className="text-[10px] font-medium text-gray-400">{timeStr}</span>
              </div>
              <p className={`text-[13px] font-semibold leading-snug ${cfg.text}`}>{action.message}</p>
              {action.action !== 'WARN' && action.action !== 'RECOMMEND' && (
                <span className="text-[10px] font-bold bg-white/70 px-1.5 py-0.5 rounded mt-1 inline-block text-gray-600 border border-gray-200">
                  ⚡ {action.action}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AgenticPolicies() {
  const router = useRouter()
  const { currentUser, loading: authLoading } = useAuth()
  const sim = useSimulation()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'budget' | 'limits' | 'rules' | 'feed'

  useEffect(() => {
    if (!sim || sim.isLoading || authLoading) return
    setLoading(false)
  }, [sim?.isLoading, authLoading])

  if (authLoading || loading || !sim.policies) {
    return (
      <AppLayout>
        <Header title="Agentic Control Centre" subtitle="Policy engine initialising..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 size={36} className="animate-spin text-[#1428A0]" />
            <p className="text-sm font-semibold">Loading policy engine...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const summary = sim.policyEngineSummary
  const projections = sim.projections
  const policies = sim.policies

  function updateLocal(key, value) {
    sim.updatePolicies({ ...policies, [key]: value })
  }

  function updateApplianceLimit(type, dailyKwh) {
    sim.updatePolicies({
      ...policies,
      applianceLimits: policies.applianceLimits.map(l =>
        l.type === type ? { ...l, dailyKwh: Number(dailyKwh) } : l
      ),
    })
  }

  const agentStatus = summary?.agentStatus || 'Nominal'
  const statusColor = {
    Critical: 'text-red-600', Warning: 'text-amber-600',
    Active: 'text-blue-600', Nominal: 'text-green-600',
  }[agentStatus] || 'text-gray-600'

  const headerBadge = (
    <div className={`p-1.5 rounded-lg shadow-sm ${agentStatus === 'Critical' ? 'bg-red-50' : agentStatus === 'Warning' ? 'bg-amber-50' : 'bg-green-50'}`}>
      <ShieldCheck size={16} strokeWidth={2.5} className={statusColor} />
    </div>
  )

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'budget', label: 'Budget & Projections' },
    { id: 'limits', label: 'Device Limits' },
    { id: 'rules', label: 'Policy Rules' },
    { id: 'feed', label: `Agent Feed${sim.agentActions?.length > 0 ? ` (${sim.agentActions.length})` : ''}` },
  ]

  return (
    <AppLayout>
      <Header
        title="Agentic Control Centre"
        titleExtra={headerBadge}
        subtitle="Rule-based policy engine for enterprise-grade energy management."
      />

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-28 scroll-smooth">
        <div className="max-w-[1500px] mx-auto pt-2 space-y-6 lg:space-y-8">

          {/* ── Agent Status Banner ──────────────────────────────────────── */}
          {agentStatus === 'Critical' && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-600 shrink-0" />
              <p className="text-sm font-bold text-red-700">
                Critical policy violations detected. {summary?.criticalAlerts} device(s) breached set limits.
                {policies.autonomyLevel !== 'autonomous' && ' Enable Autonomous mode to auto-enforce.'}
              </p>
            </div>
          )}

          {/* ── KPI Row ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch">
            <SummaryCard
              title="Agent Status"
              value={agentStatus}
              sub={`Autonomy: ${policies.autonomyLevel}`}
              icon={Bot}
              iconBg="bg-blue-50" iconColor="text-[#1428A0]"
              highlight={agentStatus === 'Critical'}
            />
            <SummaryCard
              title="Actions Taken"
              value={`${summary?.totalActions ?? 0}`}
              sub={`${summary?.criticalAlerts ?? 0} critical · ${summary?.warnings ?? 0} warnings`}
              icon={Zap}
              iconBg="bg-orange-50" iconColor="text-orange-500"
            />
            <SummaryCard
              title="Energy Saved"
              value={`${summary?.savedKwh ?? 0} kWh`}
              sub={`≈ ₹${summary?.savedRupees ?? 0} saved this period`}
              icon={TrendingDown}
              iconBg="bg-green-50" iconColor="text-green-600"
            />
            <SummaryCard
              title="Budget Used"
              value={`${summary?.budgetUsedPct ?? 0}%`}
              sub={projections?.willExceedBudget ? `⚠ Projected overage: ${projections.overageKwh} kWh` : 'Within budget'}
              icon={IndianRupee}
              iconBg="bg-purple-50" iconColor="text-purple-500"
              highlight={projections?.willExceedBudget}
            />
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-gray-100/80 p-1 rounded-2xl w-full overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 whitespace-nowrap
                  ${activeTab === tab.id ? 'bg-white text-[#1428A0] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB: OVERVIEW */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

              {/* Autonomy Selector */}
              <div className="lg:col-span-2 bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#1428A0]/10 flex items-center justify-center">
                    <Bot size={18} className="text-[#1428A0]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Agent Autonomy Level</h3>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">Controls how aggressively the engine enforces your policies</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {AUTONOMY_LEVELS.map(level => (
                    <button
                      key={level.id}
                      onClick={() => updateLocal('autonomyLevel', level.id)}
                      className={`relative p-5 rounded-[20px] border-2 text-left transition-all duration-200 group
                        ${policies.autonomyLevel === level.id
                          ? `border-[#1428A0] ${level.bg} shadow-md`
                          : 'border-gray-100 hover:border-gray-200 bg-[#F7F9FC]'
                        }`}
                    >
                      {policies.autonomyLevel === level.id && (
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#1428A0]" />
                      )}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${policies.autonomyLevel === level.id ? level.bg : 'bg-gray-100'}`}>
                        <div className={`w-3 h-3 rounded-full ${level.dot}`} />
                      </div>
                      <p className={`text-sm font-bold mb-1 ${policies.autonomyLevel === level.id ? level.color : 'text-gray-700'}`}>{level.label}</p>
                      <p className="text-[11px] font-medium text-gray-500 leading-snug">{level.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Mode Selector */}
              <div className="bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Operating Mode</h3>
                <div className="space-y-2.5">
                  {MODES.map(mode => {
                    const ModeIcon = mode.icon
                    const isActive = policies.activeMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        onClick={() => updateLocal('activeMode', mode.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-[14px] border-2 text-left transition-all
                          ${isActive ? 'border-[#1428A0] bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-[#F7F9FC]'}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-[#1428A0]' : 'bg-white border border-gray-200'}`}>
                          <ModeIcon size={15} className={isActive ? 'text-white' : 'text-gray-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${isActive ? 'text-[#1428A0]' : 'text-gray-800'}`}>{mode.label}</p>
                          <p className="text-[10px] font-medium text-gray-400 truncate">{mode.description}</p>
                        </div>
                        {isActive && <div className="w-2 h-2 rounded-full bg-[#1428A0] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB: BUDGET & PROJECTIONS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'budget' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">

              {/* Budget Config */}
              <div className="lg:col-span-2 bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Budget Limits</h3>

                <PolicyToggle
                  label="Enable Budget Guard"
                  description="Enforce a monthly energy cap and trigger agent actions."
                  enabled={policies.budgetEnabled}
                  onToggle={() => updateLocal('budgetEnabled', !policies.budgetEnabled)}
                />

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2">
                      Monthly kWh Cap
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={policies.budgetKwh}
                        onChange={e => updateLocal('budgetKwh', Number(e.target.value))}
                        disabled={!policies.budgetEnabled}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1428A0]/30 disabled:opacity-40 bg-[#F7F9FC]"
                      />
                      <span className="text-sm font-bold text-gray-500 w-10">kWh</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2">
                      Monthly ₹ Budget
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={policies.budgetRupees}
                        onChange={e => updateLocal('budgetRupees', Number(e.target.value))}
                        disabled={!policies.budgetEnabled}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1428A0]/30 disabled:opacity-40 bg-[#F7F9FC]"
                      />
                      <span className="text-sm font-bold text-gray-500 w-10">₹</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projections Panel */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Month Projections</h3>
                  {projections ? (
                    <div className="space-y-6">
                      <BudgetGauge
                        label="Energy Budget"
                        current={projections.currentMonthKwh}
                        projected={projections.projectedMonthlyKwh}
                        limit={policies.budgetKwh}
                        unit="kWh"
                        color="bg-[#2189FF]"
                      />
                      <BudgetGauge
                        label="Cost Budget"
                        current={projections.currentMonthCost}
                        projected={projections.projectedMonthlyCost}
                        limit={policies.budgetRupees}
                        unit="₹"
                        color="bg-purple-500"
                      />
                      <div className="grid grid-cols-3 gap-3 pt-2">
                        {[
                          { label: 'Month-to-Date', value: `${projections.currentMonthKwh} kWh`, sub: `₹${projections.currentMonthCost}` },
                          { label: 'Projected Total', value: `${projections.projectedMonthlyKwh} kWh`, sub: `₹${projections.projectedMonthlyCost}`, alert: projections.willExceedBudget },
                          { label: 'Carbon Projected', value: `${projections.projectedCarbon} kg`, sub: 'CO₂ equivalent' },
                        ].map((item, i) => (
                          <div key={i} className={`p-4 rounded-[16px] border ${item.alert ? 'bg-red-50 border-red-200' : 'bg-[#F7F9FC] border-gray-100'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${item.alert ? 'text-red-500' : 'text-gray-400'}`}>{item.label}</p>
                            <p className={`text-lg font-extrabold leading-tight ${item.alert ? 'text-red-700' : 'text-gray-900'}`}>{item.value}</p>
                            <p className="text-xs font-semibold text-gray-400 mt-0.5">{item.sub}</p>
                          </div>
                        ))}
                      </div>
                      {projections.willExceedBudget && policies.budgetEnabled && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
                          <AlertTriangle size={18} className="text-red-600 shrink-0" />
                          <p className="text-sm font-bold text-red-700">
                            At current pace, budget will be exceeded by {projections.overageKwh} kWh.
                            {projections.daysToExceedKwh != null && ` Budget will run out in ~${projections.daysToExceedKwh} day(s).`}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm font-semibold">
                      Play the simulation to generate projections.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB: DEVICE LIMITS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'limits' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Daily Appliance Limits</h3>
                <p className="text-sm font-medium text-gray-500 mb-6">Set a daily kWh cap per device type. Agent will enforce when exceeded. Set to 0 to disable.</p>
                <div className="space-y-5">
                  {(policies.applianceLimits || []).map((limit) => (
                    <div key={limit.type} className="flex items-center gap-4 p-4 rounded-[16px] bg-[#F7F9FC] border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        {limit.type === 'ac' && <Wind size={18} className="text-[#2189FF]" />}
                        {limit.type === 'geyser' && <Flame size={18} className="text-orange-500" />}
                        {limit.type === 'tv' && <Tv size={18} className="text-indigo-500" />}
                        {limit.type === 'washing_machine' && <Shirt size={18} className="text-cyan-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{limit.label}</p>
                        <p className="text-xs font-medium text-gray-400">{limit.dailyKwh > 0 ? `Cap: ${limit.dailyKwh} kWh / day` : 'No limit set'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={limit.dailyKwh}
                          onChange={e => updateApplianceLimit(limit.type, e.target.value)}
                          className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1428A0]/30 bg-white"
                        />
                        <span className="text-xs font-bold text-gray-400 w-8">kWh</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Hour Config */}
              <div className="space-y-6">
                <div className="bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80">
                  <h3 className="text-lg font-bold text-gray-900 mb-5">Peak Hour Restriction</h3>
                  <PolicyToggle
                    label="Enable Peak Hour Policy"
                    description="Defer or shut down high-draw devices during peak electricity hours."
                    enabled={policies.peakHourPolicyEnabled}
                    onToggle={() => updateLocal('peakHourPolicyEnabled', !policies.peakHourPolicyEnabled)}
                  />
                  {policies.peakHourPolicyEnabled && (
                    <div className="grid grid-cols-2 gap-4 mt-5">
                      <div>
                        <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2">Start Hour (24h)</label>
                        <input
                          type="number" min={0} max={23}
                          value={policies.peakHourStart}
                          onChange={e => updateLocal('peakHourStart', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1428A0]/30 bg-[#F7F9FC]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2">End Hour (24h)</label>
                        <input
                          type="number" min={0} max={23}
                          value={policies.peakHourEnd}
                          onChange={e => updateLocal('peakHourEnd', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1428A0]/30 bg-[#F7F9FC]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80">
                  <h3 className="text-lg font-bold text-gray-900 mb-5">Occupancy & Anomaly</h3>
                  <div className="space-y-3">
                    <PolicyToggle
                      label="Unoccupied Room Shutoff"
                      description="Turn off devices when no occupancy is detected in a room."
                      enabled={policies.unoccupiedPolicyEnabled}
                      onToggle={() => updateLocal('unoccupiedPolicyEnabled', !policies.unoccupiedPolicyEnabled)}
                    />
                    <PolicyToggle
                      label="Anomaly Response"
                      description="Flag and respond to usage spikes detected as anomalies."
                      enabled={policies.anomalyPolicyEnabled}
                      onToggle={() => updateLocal('anomalyPolicyEnabled', !policies.anomalyPolicyEnabled)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB: POLICY RULES REFERENCE */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'rules' && (
            <div className="bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Active Policy Rules</h3>
              <p className="text-sm font-medium text-gray-500 mb-7">All rules are evaluated deterministically in priority order on every simulation tick.</p>
              <div className="space-y-4">
                {[
                  { priority: 1, name: 'Budget Guard', active: policies.budgetEnabled, desc: `Shuts down non-critical devices when monthly usage exceeds ${policies.budgetKwh} kWh cap.`, severity: 'critical' },
                  { priority: 2, name: 'Appliance Daily Limit', active: policies.applianceLimits?.some(l => l.dailyKwh > 0), desc: 'Enforces per-device daily kWh caps. Device is turned off once limit is reached.', severity: 'warning' },
                  { priority: 3, name: 'Peak Hour Restriction', active: policies.peakHourPolicyEnabled, desc: `Defers or shuts down high-draw devices between ${policies.peakHourStart}:00–${policies.peakHourEnd}:00.`, severity: 'warning' },
                  { priority: 4, name: 'Unoccupied Room Shutoff', active: policies.unoccupiedPolicyEnabled, desc: 'Turns off devices detected as ON in unoccupied rooms.', severity: 'warning' },
                  { priority: 5, name: 'Anomaly Alert & Response', active: policies.anomalyPolicyEnabled, desc: 'Flags anomalous usage events. In Autonomous mode, force-shuts threshold-exceeded devices.', severity: 'critical' },
                  { priority: 6, name: 'Eco Mode AC Cap', active: policies.activeMode === 'eco', desc: 'In Eco Mode, caps AC usage at 0.8 kWh/hr and recommends thermostat increases.', severity: 'info' },
                  { priority: 7, name: 'Vacation Mode', active: policies.activeMode === 'vacation', desc: 'Shuts down all non-essential devices. Only fridge, router, and security remain on.', severity: 'info' },
                ].map(rule => (
                  <div key={rule.priority} className={`flex items-center gap-4 p-5 rounded-[18px] border ${rule.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-[#F7F9FC] opacity-60'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-extrabold ${rule.active ? 'bg-[#1428A0] text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {rule.priority}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-gray-900">{rule.name}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          rule.severity === 'critical' ? 'bg-red-50 text-red-600' :
                          rule.severity === 'warning' ? 'bg-amber-50 text-amber-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>{rule.severity}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-500">{rule.desc}</p>
                    </div>
                    <div className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${rule.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {rule.active ? 'Active' : 'Off'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB: AGENT FEED */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'feed' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Agent Activity Feed</h3>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">Real-time log of all policy engine decisions</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${sim.isPlaying ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${sim.isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    {sim.isPlaying ? 'Live' : 'Paused'}
                  </div>
                </div>
                <AgentActionFeed actions={sim.agentActions || []} />
              </div>

              {/* Feed Stats */}
              <div className="space-y-4">
                {[
                  { label: 'Critical Enforcements', value: summary?.criticalAlerts ?? 0, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                  { label: 'Warnings Issued', value: summary?.warnings ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'Info / Recommendations', value: summary?.infoAlerts ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Energy Reclaimed', value: `${summary?.savedKwh ?? 0} kWh`, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                  { label: 'Cost Saved', value: `₹${summary?.savedRupees ?? 0}`, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                  { label: 'CO₂ Reduced', value: `${summary?.savedCarbonKg ?? 0} kg`, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-[16px] border ${item.bg} ${item.border}`}>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{item.label}</span>
                    <span className={`text-lg font-extrabold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  )
}
