'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import {
  fetchUserProfile,
  fetchWeeklyLogs,
  generateAutomationRules,
  getUniqueDevices,
} from '../../firebase/firestoreService'
import {
  Zap,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Lightbulb,
  Thermometer,
  Flame,
  Tv,
  Shirt,
  Fan,
  Wind,
  ArrowDown,
  Edit3,
  Plus,
  RefreshCw,
  FlaskConical,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Icon resolution ────────────────────────────────────────────────────────────
const ICON_MAP = { Lightbulb, Thermometer, Flame, Tv, Shirt, Fan, Wind, Zap }
const ICON_BG_MAP = {
  Lightbulb:   { iconBg: 'bg-yellow-50',  iconColor: 'text-yellow-500' },
  Thermometer: { iconBg: 'bg-blue-50',    iconColor: 'text-[#2189FF]'  },
  Flame:       { iconBg: 'bg-orange-50',  iconColor: 'text-orange-500' },
  Tv:          { iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-500' },
  Shirt:       { iconBg: 'bg-cyan-50',    iconColor: 'text-cyan-500'   },
  Fan:         { iconBg: 'bg-teal-50',    iconColor: 'text-teal-500'   },
  Wind:        { iconBg: 'bg-sky-50',     iconColor: 'text-sky-500'    },
  Zap:         { iconBg: 'bg-green-50',   iconColor: 'text-green-500'  },
}

function resolveRuleIcon(iconType) {
  return ICON_MAP[iconType] || Zap
}
function resolveRuleStyle(iconType) {
  return ICON_BG_MAP[iconType] || { iconBg: 'bg-gray-50', iconColor: 'text-gray-500' }
}

// ── Page-local Sub-components ─────────────────────────────────────────────────

function SummaryCard({ title, value, icon: Icon, iconColor, iconBg }) {
  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 premium-shadow ring-1 ring-gray-100/60 flex flex-col justify-between h-full group hover:ring-[#2189FF]/20 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${iconBg}`}>
          <Icon size={24} className={iconColor} strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <h4 className="text-[28px] lg:text-[32px] font-extrabold text-gray-900 tracking-tight leading-none mb-2.5">{value}</h4>
        <p className="text-[12px] font-bold tracking-widest uppercase text-gray-400">{title}</p>
      </div>
    </div>
  )
}

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2189FF] focus-visible:ring-offset-2 ${enabled ? 'bg-[#2189FF]' : 'bg-gray-200'}`}
    >
      <span className="sr-only">Toggle rule</span>
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function AutomationRuleCard({ rule }) {
  const [enabled, setEnabled] = useState(rule.defaultEnabled)
  const Icon = resolveRuleIcon(rule.iconType)
  const { iconBg, iconColor } = resolveRuleStyle(rule.iconType)

  return (
    <div className="bg-white rounded-[28px] p-7 lg:p-8 premium-shadow ring-1 ring-gray-100/80 flex flex-col h-full group hover:ring-[#2189FF]/30 hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4 pr-4">
          <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 ${enabled ? iconBg : 'bg-gray-50 text-gray-400'} transition-colors duration-300`}>
            <Icon size={24} strokeWidth={2.5} className={enabled ? iconColor : 'text-gray-400'} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-gray-900 leading-tight mb-2 tracking-tight">{rule.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${enabled ? 'bg-green-50 text-green-600 ring-1 ring-green-100/50' : 'bg-gray-100 text-gray-500'}`}>
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
        <div className="pt-1">
          <ToggleSwitch enabled={enabled} onChange={() => setEnabled(!enabled)} />
        </div>
      </div>

      {/* IF/THEN Logic */}
      <div className={`flex flex-col flex-1 mb-8 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-50 grayscale-[40%]'}`}>
        <div className="bg-[#F7F9FC] rounded-[18px] p-5 lg:p-6 border border-gray-200/60 relative flex-1 flex items-center">
          <div className="absolute -top-3 left-6 bg-white border border-gray-200 px-3 py-0.5 rounded-full shadow-sm">
            <span className="text-[10px] font-extrabold text-gray-500 tracking-widest uppercase">IF</span>
          </div>
          <p className="text-[15px] font-semibold text-gray-700 leading-snug">{rule.ifText}</p>
        </div>
        <div className="-my-3 relative z-10 flex justify-center shrink-0">
          <div className="w-8 h-8 rounded-full bg-white border border-gray-100/80 shadow-sm flex items-center justify-center">
            <ArrowDown size={16} className="text-gray-400" strokeWidth={2.5} />
          </div>
        </div>
        <div className="bg-blue-50/50 rounded-[18px] p-5 lg:p-6 border border-blue-100/60 relative flex-1 flex items-center">
          <div className="absolute -top-3 left-6 bg-white border border-blue-100/80 px-3 py-0.5 rounded-full shadow-sm">
            <span className="text-[10px] font-extrabold text-[#1428A0] tracking-widest uppercase">THEN</span>
          </div>
          <p className="text-[15px] font-bold text-[#1428A0] leading-snug">{rule.thenText}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-5 border-t border-gray-100/80 shrink-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Estimated Saving</p>
          <p className="text-[16px] font-extrabold text-green-600 flex items-center gap-1.5 leading-none">
            <Zap size={16} className="fill-green-600" /> {rule.saving}
          </p>
        </div>
        <button className="w-11 h-11 rounded-[14px] bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-[#2189FF] flex items-center justify-center transition-colors active:scale-[0.98]">
          <Edit3 size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

// ── AutomationRules Page ──────────────────────────────────────────────────────
export default function AutomationRules() {
  const router = useRouter()
  const { currentUser, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rules, setRules] = useState([])
  const [summaryStats, setSummaryStats] = useState({
    activeRules: 0,
    estimatedSaving: '₹0',
    automatedDevices: 0,
    status: 'No Data',
  })

  useEffect(() => {
    let isMounted = true

    async function fetchRulesData() {
      if (!currentUser?.uid) {
        if (isMounted) setLoading(false)
        return
      }
      setLoading(true)
      setError(null)

      try {
        const userProfile = await fetchUserProfile(currentUser.uid)
        const houseId = userProfile?.house_id || userProfile?.houseId || 'HOUSE001'

        const weeklyLogs = await fetchWeeklyLogs(houseId)
        const generatedRules = generateAutomationRules(weeklyLogs)
        const uniqueDevices = getUniqueDevices(weeklyLogs)

        // Compute summary
        const totalSavingRupees = generatedRules.reduce((sum, r) => {
          const match = r.saving.match(/\d+/)
          return sum + (match ? parseInt(match[0]) : 0)
        }, 0)

        // Compute projected monthly saving
        const anomalousCost = weeklyLogs
          .filter(l => l.ai_flag !== 'Normal' || l.threshold_exceeded)
          .reduce((s, l) => s + (Number(l.electricity_cost) || 0), 0)
        const monthlySaving = Math.round(anomalousCost * 4.3)

        const hasAnomalies = weeklyLogs.some(l => l.ai_flag !== 'Normal' || l.threshold_exceeded)

        if (isMounted) {
          setRules(generatedRules)
          setSummaryStats({
            activeRules: generatedRules.length,
            estimatedSaving: `₹${monthlySaving || totalSavingRupees}`,
            automatedDevices: uniqueDevices.length,
            status: hasAnomalies ? 'Needs Attention' : 'Optimal',
          })
          setLoading(false)
        }
      } catch (err) {
        console.error('Automation rules fetch error:', err)
        if (isMounted) {
          setError(`Failed to load automation rules: ${err.message}`)
          setLoading(false)
        }
      }
    }

    fetchRulesData()
    return () => { isMounted = false }
  }, [currentUser?.uid])

  const ruleBadge = (
    <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg shadow-sm">
      <RefreshCw size={16} strokeWidth={2.5} />
    </div>
  )

  if (authLoading || loading) {
    return (
      <AppLayout>
        <Header title="Automation Rules" titleExtra={ruleBadge} subtitle="Manage intelligent SmartThings automation policies." />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 size={36} className="animate-spin text-[#1428A0]" />
            <p className="text-sm font-semibold">Analysing energy patterns...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Header
        title="Automation Rules"
        titleExtra={ruleBadge}
        subtitle="Manage intelligent SmartThings automation policies to optimize household energy consumption."
      />

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-12 scroll-smooth">
        <div className="max-w-[1500px] mx-auto pt-2 space-y-6 lg:space-y-8">

          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
            <SummaryCard title="Active Rules"              value={`${summaryStats.activeRules}`}     icon={CheckCircle2} iconColor="text-green-500"   iconBg="bg-green-50" />
            <SummaryCard title="Estimated Monthly Saving"  value={summaryStats.estimatedSaving}      icon={Zap}          iconColor="text-[#1428A0]"   iconBg="bg-blue-50" />
            <SummaryCard title="Automated Devices"         value={`${summaryStats.automatedDevices}`} icon={Cpu}          iconColor="text-[#2189FF]"   iconBg="bg-blue-50/50" />
            <SummaryCard title="Automation Status"         value={summaryStats.status}               icon={ShieldCheck}  iconColor="text-purple-500"  iconBg="bg-purple-50" />
          </div>

          {/* Rules Grid */}
          <div className="pt-4">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-400 mb-5 ml-1">Energy Saving Policies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {rules.map((rule) => (
                <AutomationRuleCard key={rule.id} rule={rule} />
              ))}

              {/* Add Rule Card */}
              <div className="bg-[#F7F9FC] border-2 border-dashed border-gray-300 hover:border-[#2189FF]/50 hover:bg-white rounded-[28px] p-8 flex flex-col items-center justify-center h-full group cursor-pointer transition-all duration-300 min-h-[380px] hover:shadow-lg">
                <div className="w-16 h-16 rounded-[20px] bg-white shadow-sm ring-1 ring-gray-100/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Plus size={28} className="text-gray-400 group-hover:text-[#2189FF]" strokeWidth={2.5} />
                </div>
                <h3 className="text-[17px] font-bold text-gray-900 mb-2">Create Custom Rule</h3>
                <p className="text-sm font-medium text-gray-500 text-center max-w-[200px] leading-relaxed">Design a new IF/THEN automation policy.</p>
              </div>
            </div>

            {rules.length === 0 && !loading && (
              <p className="text-center text-sm font-semibold text-gray-400 py-4">
                No automation patterns detected. Energy data will be analysed automatically.
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 pb-8 border-t border-gray-100/80">
            <button
              onClick={() => router.push('/simulation')}
              className="px-7 py-3.5 rounded-[16px] border-2 border-gray-100 bg-white text-gray-700 font-bold text-[14px] hover:bg-gray-50 hover:border-gray-200 hover:text-gray-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-sm hover:shadow"
            >
              <FlaskConical size={18} strokeWidth={2.5} className="text-gray-400" /> Run Simulation
            </button>
            <button className="px-7 py-3.5 rounded-[16px] bg-[#1428A0] text-white font-bold text-[14px] hover:bg-[#102080] transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.35)] active:scale-[0.98] flex items-center justify-center gap-2.5">
              <Plus size={18} strokeWidth={2.5} className="text-blue-200" /> Create New Rule
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
