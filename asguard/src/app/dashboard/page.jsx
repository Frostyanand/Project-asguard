'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import {
  fetchUserProfile,
  fetchLogCount,
  fetchTodayLogs,
  fetchWeeklyLogs,
  getDashboardMetrics,
  generateRecommendations,
  getUniqueDevices,
} from '../../firebase/firestoreService'
import {
  Zap,
  ChevronRight,
  CheckCircle2,
  Wifi,
  Power,
  Settings,
  Activity,
  Home,
  Smartphone,
  Bot,
  FlaskConical,
  Loader2,
  AlertTriangle,
  BarChart3,
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [houseName, setHouseName] = useState('')
  const [metrics, setMetrics] = useState({
    totalLogs: 0,
    connectedDevices: 0,
    todayUsageKwh: 0,
    todayCost: 0,
    efficiencyScore: 0,
    chartData: [],
    recommendation: null,
  })

  useEffect(() => {
    let isMounted = true

    async function fetchDashboardData() {
      if (!currentUser?.uid) {
        if (isMounted) setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Step 1: Read user profile
        const userProfile = await fetchUserProfile(currentUser.uid)

        if (!userProfile) {
          if (isMounted) {
            setError(`User document not found in Firestore.`)
            setLoading(false)
          }
          return
        }

        if (isMounted) {
          setHouseName(userProfile.houseName || '')
        }

        const houseId = userProfile.house_id || userProfile.houseId || 'HOUSE001'

        // Step 2: Parallel fetch — log count + today's logs + weekly logs
        const [totalLogCount, todayLogs, weeklyLogs] = await Promise.all([
          fetchLogCount(houseId),
          fetchTodayLogs(houseId),
          fetchWeeklyLogs(houseId),
        ])

        // Step 3: Compute dashboard metrics
        const dashMetrics = getDashboardMetrics(todayLogs, weeklyLogs, totalLogCount)

        // Step 4: Generate recommendation from weekly logs
        const recs = generateRecommendations(weeklyLogs)

        if (isMounted) {
          setMetrics({
            ...dashMetrics,
            recommendation: recs.mainRecommendation
              ? {
                  text: `Your ${recs.mainRecommendation.applianceName} contributed ${recs.mainRecommendation.percent}% of recent energy usage. ${recs.mainRecommendation.actionText}`,
                  saving: recs.estimatedMonthlySaving > 0 ? `₹${recs.estimatedMonthlySaving}` : null,
                }
              : null,
          })
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err)
        if (isMounted) {
          setError(`Failed to load dashboard: ${err.message}`)
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid])

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

  const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : "User"

  // Compute SVG Points for chartData
  const maxKwh = metrics.chartData.length > 0
    ? Math.max(50, ...metrics.chartData.map(d => d.totalKwh))
    : 50

  const points = metrics.chartData.map((d, index) => {
    const x = metrics.chartData.length > 1 ? (index / (metrics.chartData.length - 1)) * 100 : 50
    const y = 100 - (d.totalKwh / maxKwh) * 90
    return { x, y }
  })

  const linePath = points.reduce((path, pt, index) => {
    return path + `${index === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
  }, '')

  const fillPath = points.length > 0 ? `${linePath} L 100,100 L 0,100 Z` : ''

  return (
    <AppLayout>
      <Header
        title={`Welcome Back, ${firstName}`}
        subtitle={houseName ? `${houseName} Overview` : 'Dashboard Overview'}
      />

      {/* Scrollable Dashboard Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-16 scroll-smooth">
        <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
          
          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Hero & AI Rec */}
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
                  <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-500">Digital Twin & Firebase Status</h3>
                  <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    LIVE SYNCED
                  </span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                  Your smart home is live and synchronized with Firestore.
                </h2>
                <p className="text-gray-500 font-semibold flex items-center gap-2 mb-10">
                  <CheckCircle2 size={18} className="text-[#2189FF]" />
                  Connected User: {currentUser?.email || "Authenticated Session"}
                </p>
                <button
                  onClick={() => router.push('/digital-twin')}
                  className="bg-[#1428A0] hover:bg-[#102080] text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.3)] flex items-center gap-2 active:scale-[0.98] w-max"
                >
                  Open Digital Twin
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="lg:col-span-4 bg-gradient-to-br from-[#1428A0] to-[#1a36c4] rounded-[24px] p-8 lg:p-10 premium-shadow relative overflow-hidden text-white flex flex-col justify-between h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2189FF] rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                    <Bot size={22} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-blue-100">Latest Recommendation</h3>
                </div>
                {metrics.recommendation ? (
                  <>
                    <p className="text-xl lg:text-2xl font-medium leading-snug mb-8">
                      {metrics.recommendation.text}
                    </p>
                    {metrics.recommendation.saving && (
                      <div className="bg-black/20 rounded-[16px] p-5 mb-8 border border-white/10 flex items-center justify-between backdrop-blur-sm">
                        <span className="text-sm text-blue-100 font-semibold">Potential Saving</span>
                        <span className="text-3xl font-bold text-white flex items-center gap-1.5">
                          <Zap size={24} className="text-yellow-400 fill-yellow-400" />
                          {metrics.recommendation.saving}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xl lg:text-2xl font-medium leading-snug mb-8">
                    No recommendations available.
                  </p>
                )}
              </div>
              <button 
                onClick={() => router.push('/ai-assistant')}
                className="relative z-10 w-full bg-white text-[#1428A0] hover:bg-gray-50 font-bold text-base py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                View AI Insights
              </button>
            </div>
          </div>

          {/* Row 2: Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
            <StatCard icon={Wifi}     label="Connected Devices"   value={`${metrics.connectedDevices}`} subtext="From Energy Logs" colorClass="text-[#2189FF]"    bgClass="bg-[#2189FF]/10" />
            <StatCard icon={Power}    label="Daily Household Energy" value={`${metrics.todayUsageKwh} kWh`} subtext={`₹${metrics.todayCost.toFixed(2)} today`} colorClass="text-orange-500"   bgClass="bg-orange-50" />
            <StatCard icon={Settings} label="Cloud Energy Logs"    value={`${metrics.totalLogs.toLocaleString()}`} subtext="Firestore Records" colorClass="text-purple-500"  bgClass="bg-purple-50" />
            <StatCard icon={Activity} label="Efficiency Score"    value={`${metrics.efficiencyScore}/100`} subtext="Based on anomaly ratio" colorClass="text-green-500"   bgClass="bg-green-50" />
          </div>

          {/* Row 3: Quick Actions */}
          <div className="pt-2">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-gray-500 mb-5 ml-1">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 items-stretch">
              <QuickActionCard icon={Smartphone}   label="Scan Room"          onClick={() => router.push('/upload')} />
              <QuickActionCard icon={Home}          label="View Digital Twin"  onClick={() => router.push('/digital-twin')} />
              <QuickActionCard icon={Bot}           label="AI Assistant"       onClick={() => router.push('/ai-assistant')} />
              <QuickActionCard icon={BarChart3}     label="Analytics"          onClick={() => router.push('/analytics')} />
              <QuickActionCard icon={FlaskConical}  label="Simulation"         onClick={() => router.push('/simulation')} />
            </div>
          </div>

          {/* Row 4: Chart & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-2">

            {/* Chart */}
            <div className="lg:col-span-8 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Weekly Energy Usage</h3>
                  <p className="text-sm font-semibold text-gray-500 mt-1.5">Live consumption trend from Firestore telemetry</p>
                </div>
              </div>

              <div className="relative flex-1 w-full min-h-[240px] pt-2">
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[12px] font-bold text-gray-400 w-10">
                  <span>{maxKwh.toFixed(0)} kWh</span><span>{(maxKwh * 0.7).toFixed(0)} kWh</span><span>{(maxKwh * 0.4).toFixed(0)} kWh</span><span>0</span>
                </div>
                <div className="absolute left-14 right-2 top-2 bottom-8">
                  <div className="absolute inset-0 flex flex-col justify-between">
                    <div className="w-full border-b border-gray-100" />
                    <div className="w-full border-b border-gray-100" />
                    <div className="w-full border-b border-gray-100" />
                    <div className="w-full border-b border-gray-200" />
                  </div>
                  {metrics.chartData.length > 0 ? (
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2189FF" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="#2189FF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path className="chart-fill" d={fillPath} fill="url(#chartGradient)" />
                      <path className="chart-line" d={linePath} fill="none" stroke="#2189FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      
                      <g className="chart-interaction-layer">
                        {points.map((pt, i) => (
                          <circle
                            key={i}
                            cx={pt.x}
                            cy={pt.y}
                            r="3"
                            fill="#2189FF"
                            className="opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-crosshair"
                            title={`${metrics.chartData[i].date}: ${metrics.chartData[i].totalKwh} kWh`}
                          />
                        ))}
                      </g>
                    </svg>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-400">
                      No energy logs available.
                    </div>
                  )}
                </div>
                <div className="absolute left-14 right-4 bottom-2 flex justify-between text-[10px] font-medium text-gray-400">
                  {metrics.chartData.map((d, idx) => (
                    <span key={idx}>{d.dayOfWeek ? d.dayOfWeek.substring(0, 3) : ''}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="lg:col-span-4 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 h-full">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-8">Firestore Activity</h3>
              <div className="relative pl-7 space-y-9">
                <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-gray-100" />
                {[
                  { label: 'Firebase User Session Active', time: currentUser?.email || 'Authenticated', active: true },
                  { label: 'Cloud Telemetry Streamed', time: `${metrics.totalLogs.toLocaleString()} Firestore Records`, active: true },
                  { label: 'Energy Analysis Complete', time: `${metrics.connectedDevices} Devices Tracked`, active: false },
                  { label: 'SmartThings Digital Twin Ready', time: houseName ? `${houseName} Model Live` : 'Model Live', active: false },
                ].map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-7 top-0.5 w-7 h-7 rounded-full ${item.active ? 'bg-blue-50' : 'bg-gray-100'} border-[3px] border-white shadow-sm flex items-center justify-center`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${item.active ? 'bg-[#2189FF]' : 'bg-gray-400'}`} />
                    </div>
                    <p className={`text-sm font-bold ${item.active ? 'text-gray-900' : 'text-gray-700'}`}>{item.label}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1.5">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="h-6" />
        </div>
      </div>
    </AppLayout>
  )
}
