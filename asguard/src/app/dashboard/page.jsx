'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useSimulation } from '../../context/SimulationContext'
import { fetchUserProfile } from '../../firebase/firestoreService'
import {
  Zap, ChevronRight, CheckCircle2, Wifi, Power, Activity,
  Home, Smartphone, Bot, FlaskConical, Loader2, AlertTriangle,
  BarChart3, ShieldCheck, Database, Clock, BellRing, TrendingDown,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

function StatCard({ icon: Icon, label, value, subtext, colorClass, bgClass }) {
  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 premium-shadow ring-1 ring-gray-100/50 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bgClass}`}>
          <Icon size={24} className={colorClass} strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-bold text-gray-900 tracking-tight mb-1.5">{value}</h4>
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
      </div>
    </div>
  )
}

function QuickActionCard({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-[24px] p-6 premium-shadow ring-1 ring-gray-100/50 hover:ring-[#2189FF]/30 hover:shadow-lg transition-all duration-300 group flex flex-col items-center justify-center gap-4 active:scale-[0.98] h-full"
    >
      <div className="w-16 h-16 rounded-[20px] bg-[#F7F9FC] group-hover:bg-[#2189FF]/10 flex items-center justify-center transition-colors duration-300">
        <Icon size={28} className="text-[#1428A0] group-hover:text-[#2189FF] transition-colors" />
      </div>
      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 text-center leading-tight">{label}</span>
    </button>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { currentUser, loading: authLoading } = useAuth()
  const sim = useSimulation()

  const [loading, setLoading] = useState(true)
  const [houseName, setHouseName] = useState('')

  // Load house name on mount
  useEffect(() => {
    let isMounted = true
    async function loadUser() {
      if (!currentUser?.uid) return
      try {
        const userProfile = await fetchUserProfile(currentUser.uid)
        if (isMounted && userProfile) setHouseName(userProfile.houseName || '')
      } catch (err) {
        console.error(err)
      }
    }
    loadUser()
    return () => { isMounted = false }
  }, [currentUser?.uid])

  // Stop loading once sim data resolves
  useEffect(() => {
    if (!sim?.isLoading && !authLoading) setLoading(false)
  }, [sim?.isLoading, authLoading])

  // ── Compute metrics directly from currentLogs ───────────────────────────────
  const metrics = useMemo(() => {
    const logs = sim?.currentLogs ?? []
    if (logs.length === 0) return {
      connectedDevices: 0, todayUsageKwh: 0, todayCost: 0,
      efficiencyScore: 0, totalAnalysed: 0, chartData: [],
    }

    // Today's logs (matching sim's virtual date)
    const vDate = new Date(sim.virtualTime)
    const vDay  = vDate.toISOString().slice(0, 10)
    const todayLogs = logs.filter(l => l.date === vDay)

    const todayKwh  = todayLogs.reduce((s, l) => s + (Number(l.energyKwh) || 0), 0)
    const todayCost = todayLogs.reduce((s, l) => s + (Number(l.electricityCost) || 0), 0)

    // Active devices = unique applianceIds that are ON in the most recent log tick
    const latestByDevice = {}
    for (const l of logs) {
      if (!latestByDevice[l.applianceId] || l.timestamp > latestByDevice[l.applianceId].timestamp) {
        latestByDevice[l.applianceId] = l
      }
    }
    const onCount = Object.values(latestByDevice).filter(l => l.status === 'ON').length

    // Efficiency: 100 - (anomaly%) 
    const totalLogs = logs.length
    const anomalyCount = logs.filter(l => l.aiFlag && l.aiFlag !== 'Normal').length
    const efficiencyScore = totalLogs > 0
      ? Math.max(0, Math.round(100 - (anomalyCount / totalLogs) * 100))
      : 0

    // Weekly chart: daily kWh for last 7 unique dates seen so far
    const dayMap = {}
    for (const l of logs) {
      if (!l.date) continue
      if (!dayMap[l.date]) dayMap[l.date] = { kwh: 0, dayOfWeek: '' }
      dayMap[l.date].kwh += Number(l.energyKwh) || 0
      if (!dayMap[l.date].dayOfWeek) {
        const d = new Date(l.date)
        dayMap[l.date].dayOfWeek = d.toLocaleDateString('en-IN', { weekday: 'short' })
      }
    }
    const chartData = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, v]) => ({ date, totalKwh: Number(v.kwh.toFixed(2)), dayOfWeek: v.dayOfWeek }))

    return {
      connectedDevices: onCount,
      todayUsageKwh: Number(todayKwh.toFixed(2)),
      todayCost: Number(todayCost.toFixed(2)),
      efficiencyScore,
      totalAnalysed: totalLogs,
      chartData,
    }
  }, [sim?.currentLogs, sim?.virtualTime])

  // ── Activity feed from agent actions ────────────────────────────────────────
  const recentActions = useMemo(() => {
    const actions = sim?.agentActions ?? []
    return actions.slice(0, 5)
  }, [sim?.agentActions])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={36} className="animate-spin text-[#1428A0]" />
          <p className="text-sm font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User'
  const isSimRunning = sim?.isPlaying ?? false
  const hasData = (sim?.currentLogs?.length ?? 0) > 1

  // Chart drawing
  const maxKwh = metrics.chartData.length > 0
    ? Math.max(1, ...metrics.chartData.map(d => d.totalKwh))
    : 1

  const points = metrics.chartData.map((d, index) => ({
    x: metrics.chartData.length > 1 ? (index / (metrics.chartData.length - 1)) * 100 : 50,
    y: 100 - (d.totalKwh / maxKwh) * 90,
  }))
  const linePath = points.reduce((p, pt, i) => p + `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '')
  const fillPath = points.length > 0 ? `${linePath} L 100,100 L 0,100 Z` : ''

  // Virtual date display
  const vDateLabel = sim?.virtualTime
    ? new Date(sim.virtualTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <AppLayout>
      <Header
        title={`Welcome Back, ${firstName}`}
        subtitle={houseName ? `${houseName} · ${vDateLabel ?? 'Overview'}` : (vDateLabel ?? 'Dashboard Overview')}
      />

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-24 scroll-smooth">
        <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8 mt-6">

          {/* Row 1: Hero & Recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

            {/* Hero Card */}
            <div className="lg:col-span-8 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 relative overflow-hidden flex flex-col justify-between h-full min-h-[280px]">
              <div className="absolute right-0 top-0 w-full md:w-[400px] h-full pointer-events-none opacity-40">
                <svg viewBox="0 0 200 200" fill="none" className="w-full h-full absolute right-[-10%] top-[-10%] scale-[1.3] text-[#2189FF]">
                  <path d="M100 20 L180 80 L180 170 L20 170 L20 80 Z" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="opacity-30" />
                  <path d="M100 30 L170 85 L170 160 L30 160 L30 85 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M30 85 L100 120 L170 85" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M100 120 L100 160" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-500">
                    {houseName || 'Smart Home'} · Energy Monitor
                  </h3>
                  {/* Badge only shows when simulation is actively playing */}
                  {isSimRunning ? (
                    <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      SIMULATION LIVE
                    </span>
                  ) : hasData ? (
                    <span className="bg-blue-50 border border-blue-100 text-[#1428A0] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                      <Database size={11} />
                      DATASET LOADED
                    </span>
                  ) : (
                    <span className="bg-gray-50 border border-gray-200 text-gray-500 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                      <Clock size={11} />
                      AWAITING DATA
                    </span>
                  )}
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                  {hasData
                    ? `Monitoring ${metrics.connectedDevices} active device${metrics.connectedDevices !== 1 ? 's' : ''}.`
                    : 'Start the simulation to begin energy monitoring.'}
                </h2>
                <p className="text-gray-500 font-semibold flex items-center gap-2 mb-10">
                  <CheckCircle2 size={18} className="text-[#2189FF]" />
                  {currentUser?.email || 'Authenticated Session'} · Firebase Auth
                </p>
                <button
                  onClick={() => router.push('/digital-twin')}
                  className="bg-[#1428A0] hover:bg-[#102080] text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.3)] flex items-center gap-2 active:scale-[0.98] w-max"
                >
                  Open Digital Twin <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Policy / Agent Summary */}
            <div className="lg:col-span-4 bg-gradient-to-br from-[#1428A0] to-[#1a36c4] rounded-[24px] p-8 lg:p-10 premium-shadow relative overflow-hidden text-white flex flex-col justify-between h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2189FF] rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                    <ShieldCheck size={22} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-blue-100">Policy Engine</h3>
                </div>

                {hasData ? (
                  <>
                    <div className="space-y-3 mb-6">
                      <div className="bg-black/20 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                        <span className="text-sm text-blue-100 font-semibold">Active Alerts</span>
                        <span className="text-2xl font-extrabold text-white">
                          {sim?.policyEngineSummary?.criticalAlerts ?? 0}
                        </span>
                      </div>
                      <div className="bg-black/20 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                        <span className="text-sm text-blue-100 font-semibold">Efficiency Score</span>
                        <span className="text-2xl font-extrabold text-white">
                          {metrics.efficiencyScore}<span className="text-base font-bold text-blue-200">/100</span>
                        </span>
                      </div>
                      <div className="bg-black/20 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                        <span className="text-sm text-blue-100 font-semibold">Today's Cost</span>
                        <span className="text-2xl font-extrabold text-white">
                          ₹{metrics.todayCost.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-blue-200 text-sm font-medium leading-relaxed mb-6">
                    Run the simulation engine to activate the policy monitoring pipeline.
                  </p>
                )}
              </div>
              <button
                onClick={() => router.push('/automation-rules')}
                className="relative z-10 w-full bg-white text-[#1428A0] hover:bg-gray-50 font-bold text-base py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                Manage Policies
              </button>
            </div>
          </div>

          {/* Row 2: Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
            <StatCard icon={Wifi}     label="Devices Active Now"     value={`${metrics.connectedDevices}`}               subtext="From last sim tick"           colorClass="text-[#2189FF]"   bgClass="bg-[#2189FF]/10" />
            <StatCard icon={Power}    label="Today's Energy Usage"   value={`${metrics.todayUsageKwh} kWh`}              subtext={`₹${metrics.todayCost.toFixed(0)} incurred`}  colorClass="text-orange-500"  bgClass="bg-orange-50" />
            <StatCard icon={Database} label="Log Records Analysed"   value={`${metrics.totalAnalysed.toLocaleString()}`} subtext="In-memory simulation data"    colorClass="text-purple-500"  bgClass="bg-purple-50" />
            <StatCard icon={Activity} label="Efficiency Score"       value={`${metrics.efficiencyScore}/100`}            subtext="Based on anomaly log ratio"  colorClass="text-green-500"   bgClass="bg-green-50" />
          </div>

          {/* Row 3: Quick Actions */}
          <div className="pt-2">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-500 mb-5 ml-1">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 items-stretch">
              <QuickActionCard icon={Smartphone}  label="Scan Room"         onClick={() => router.push('/upload')} />
              <QuickActionCard icon={Home}         label="Digital Twin"      onClick={() => router.push('/digital-twin')} />
              <QuickActionCard icon={Bot}          label="AI Assistant"      onClick={() => router.push('/ai-assistant')} />
              <QuickActionCard icon={BarChart3}    label="Analytics"         onClick={() => router.push('/analytics')} />
              <QuickActionCard icon={FlaskConical} label="Simulation"        onClick={() => router.push('/simulation')} />
            </div>
          </div>

          {/* Row 4: Chart & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-2">

            {/* Energy Chart */}
            <div className="lg:col-span-8 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Daily Energy Consumption</h3>
                  <p className="text-sm font-semibold text-gray-500 mt-1.5">
                    {metrics.chartData.length > 0
                      ? `${metrics.chartData.length} day${metrics.chartData.length > 1 ? 's' : ''} of simulation data`
                      : 'No data yet — advance the simulation to populate this chart'}
                  </p>
                </div>
                {isSimRunning && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
                  </span>
                )}
              </div>

              <div className="relative flex-1 w-full min-h-[240px] pt-2">
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[12px] font-bold text-gray-400 w-10">
                  <span>{maxKwh.toFixed(0)}</span><span>{(maxKwh * 0.7).toFixed(0)}</span><span>{(maxKwh * 0.4).toFixed(0)}</span><span>0</span>
                </div>
                <div className="absolute left-14 right-2 top-2 bottom-8">
                  <div className="absolute inset-0 flex flex-col justify-between">
                    <div className="w-full border-b border-gray-100" />
                    <div className="w-full border-b border-gray-100" />
                    <div className="w-full border-b border-gray-100" />
                    <div className="w-full border-b border-gray-200" />
                  </div>
                  {metrics.chartData.length > 0 ? (
                    <svg className="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2189FF" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="#2189FF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={fillPath} fill="url(#chartGradient)" />
                      <path d={linePath} fill="none" stroke="#2189FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <g>
                        {points.map((pt, i) => (
                          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#2189FF"
                            className="opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-crosshair">
                            <title>{metrics.chartData[i].date}: {metrics.chartData[i].totalKwh} kWh</title>
                          </circle>
                        ))}
                      </g>
                    </svg>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-400">
                      Advance the simulation to see energy trends
                    </div>
                  )}
                </div>
                <div className="absolute left-14 right-4 bottom-2 flex justify-between text-[10px] font-medium text-gray-400">
                  {metrics.chartData.map((d, idx) => (
                    <span key={idx}>{d.dayOfWeek}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Agent Activity Feed */}
            <div className="lg:col-span-4 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 h-full">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-6">Agent Activity</h3>
              {recentActions.length > 0 ? (
                <div className="relative pl-7 space-y-6">
                  <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-gray-100" />
                  {recentActions.map((action, idx) => {
                    const isAlert = action.severity === 'critical' || action.severity === 'warning'
                    return (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-7 top-0.5 w-7 h-7 rounded-full ${isAlert ? 'bg-red-50' : 'bg-blue-50'} border-[3px] border-white shadow-sm flex items-center justify-center`}>
                          {isAlert
                            ? <BellRing size={13} className="text-red-500" />
                            : <CheckCircle2 size={13} className="text-[#2189FF]" />
                          }
                        </div>
                        <p className="text-sm font-bold text-gray-900 leading-snug">{action.message || action.type || 'Policy event'}</p>
                        <p className="text-xs font-semibold text-gray-400 mt-1">
                          {action.applianceName || action.deviceId || '—'} · {action.severity || 'info'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <TrendingDown size={22} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No agent events yet</p>
                  <p className="text-xs text-gray-400 max-w-[180px]">Events appear here as the simulation advances and policies trigger</p>
                </div>
              )}
            </div>

          </div>

          <div className="h-6" />
        </div>
      </div>
    </AppLayout>
  )
}
