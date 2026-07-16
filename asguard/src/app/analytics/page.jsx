'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchUserProfile,
  fetchWeeklyLogs,
  fetchMonthlyLogs,
  getAnalyticsMetrics,
  getApplianceIcon,
  getDatasetReferenceDate,
} from '../../firebase/firestoreService'
import {
  Zap, IndianRupee, Activity, TrendingDown, TrendingUp,
  Thermometer, Lightbulb, Tv, Flame, Refrigerator, Fan,
  Download, FileText, Clock, Home, Bot, BarChart3, Loader2, AlertTriangle,
  Wind, Blinds,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Icon resolution ────────────────────────────────────────────────────────────
const ICON_MAP = {
  Thermometer, Lightbulb, Tv, Flame, Refrigerator, Fan, Wind, Blinds,
  Activity, Zap,
}

function resolveDeviceIcon(applianceType) {
  const name = getApplianceIcon(applianceType)
  return ICON_MAP[name] || Activity
}

// Donut color palette
const DONUT_COLORS = [
  '#1428A0', '#2189FF', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF',
]

// ── Page-local Sub-components ─────────────────────────────────────────────────

function SummaryCard({ title, value, icon: Icon, iconColor, iconBg, trend, trendValue }) {
  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 premium-shadow ring-1 ring-gray-100/60 flex flex-col justify-between h-full group hover:ring-[#2189FF]/20 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${iconBg}`}>
          <Icon size={24} className={iconColor} strokeWidth={2.5} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${trend === 'down' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend === 'down' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-[28px] lg:text-[32px] font-extrabold text-gray-900 tracking-tight leading-none mb-2.5">{value}</h4>
        <p className="text-[12px] font-bold tracking-widest uppercase text-gray-400">{title}</p>
      </div>
    </div>
  )
}

function InsightItem({ icon: Icon, title, value, subtitle, iconColor, iconBg }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-[18px] bg-[#F7F9FC] border border-gray-100/60">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={20} strokeWidth={2.5} className={iconColor} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">{title}</p>
        <h4 className="text-[15px] font-bold text-gray-900 leading-tight">{value}</h4>
      </div>
      {subtitle && (
        <div className="text-right">
          <span className="text-[14px] font-extrabold text-[#1428A0] bg-blue-50/80 px-2.5 py-1 rounded-lg">{subtitle}</span>
        </div>
      )}
    </div>
  )
}

// ── Analytics Page ─────────────────────────────────────────────────────────────
export default function Analytics() {
  const { currentUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchAnalyticsData() {
      if (!currentUser?.uid) {
        if (isMounted) setLoading(false)
        return
      }
      setLoading(true)
      setError(null)

      try {
        const userProfile = await fetchUserProfile(currentUser.uid)
        const houseId = userProfile?.house_id || userProfile?.houseId || 'HOUSE001'

        const refDateInfo = await getDatasetReferenceDate(houseId)
        // Parallel fetch: weekly + monthly logs
        const [weeklyLogs, monthlyLogs] = await Promise.all([
          fetchWeeklyLogs(houseId),
          fetchMonthlyLogs(houseId),
        ])

        const computed = getAnalyticsMetrics(weeklyLogs, monthlyLogs, refDateInfo)
        if (isMounted) {
          setMetrics(computed)
          setLoading(false)
        }
      } catch (err) {
        console.error('Analytics fetch error:', err)
        if (isMounted) {
          setError(`Failed to load analytics: ${err.message}`)
          setLoading(false)
        }
      }
    }

    fetchAnalyticsData()
    return () => { isMounted = false }
  }, [currentUser?.uid])

  const analyticsBadge = (
    <div className="bg-blue-100 text-[#2189FF] p-1.5 rounded-lg shadow-sm">
      <BarChart3 size={16} strokeWidth={2.5} />
    </div>
  )

  if (authLoading || loading) {
    return (
      <AppLayout>
        <Header title="Energy Analytics" titleExtra={analyticsBadge} subtitle="Monitor energy consumption, identify trends, and optimize your smart home." />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 size={36} className="animate-spin text-[#1428A0]" />
            <p className="text-sm font-semibold">Loading Analytics...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Build weekly SVG chart points
  const chartData = metrics?.weeklyChartData || []
  const maxKwh = chartData.length > 0 ? Math.max(10, ...chartData.map(d => d.totalKwh)) : 10
  const points = chartData.map((d, i) => ({
    x: chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 50,
    y: 100 - (d.totalKwh / maxKwh) * 90,
    label: d.dayOfWeek,
    kwh: d.totalKwh,
  }))
  const linePath = points.reduce((path, pt, i) =>
    path + `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '')
  const fillPath = points.length > 0 ? `${linePath} L 100,100 L 0,100 Z` : ''

  // Build bar chart heights
  const peakData = metrics?.peakHourData || []
  const maxPeak = peakData.length > 0 ? Math.max(0.01, ...peakData.map(p => p.kwh)) : 1
  const barSlots = [
    { key: 'Morning', x: 8 },
    { key: 'Afternoon', x: 33 },
    { key: 'Evening', x: 58 },
    { key: 'Night', x: 83 },
  ]
  const barColors = ['#BFDBFE', '#1428A0', '#2189FF', '#93C5FD']

  // Build donut segments
  const donutData = metrics?.donutData || []
  const donutSegments = (() => {
    let offset = 0
    return donutData.map((item, i) => {
      const dash = item.percent
      const seg = { ...item, dashArray: `${dash} ${100 - dash}`, dashOffset: -offset, color: DONUT_COLORS[i] || '#BFDBFE' }
      offset += dash
      return seg
    })
  })()

  return (
    <AppLayout>
      <Header
        title="Energy Analytics"
        titleExtra={analyticsBadge}
        subtitle="Monitor energy consumption, identify trends, and optimize your smart home."
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
            <SummaryCard title="Today's Energy Usage"     value={`${metrics?.todayUsageKwh ?? 0} kWh`}  icon={Zap}         iconColor="text-orange-500"  iconBg="bg-orange-50"    trend="down" trendValue="Live" />
            <SummaryCard title="Today's Cost"             value={`₹${metrics?.todayCost ?? 0}`}          icon={IndianRupee} iconColor="text-green-600"   iconBg="bg-green-50"     trend="down" trendValue="Live" />
            <SummaryCard title="Estimated Monthly Cost"   value={`₹${metrics?.estimatedMonthlyCost ?? 0}`} icon={TrendingUp}  iconColor="text-[#1428A0]"   iconBg="bg-blue-50" />
            <SummaryCard title="Energy Efficiency Score"  value={`${metrics?.efficiencyScore ?? 0} / 100`} icon={Activity}    iconColor="text-[#2189FF]"   iconBg="bg-blue-50/50" />
          </div>

          {/* Row 2: Line Chart + Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

            {/* Line Chart */}
            <div className="lg:col-span-8 bg-white rounded-[28px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/80 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Weekly Energy Usage</h3>
                  <p className="text-sm font-semibold text-gray-500 mt-1">Total consumption trends over the last 7 days</p>
                </div>
              </div>
              <div className="relative flex-1 w-full min-h-[260px] pt-8 pb-4">
                <div className="absolute left-0 top-6 bottom-12 flex flex-col justify-between text-[10px] font-medium text-gray-400 w-8">
                  <span>{maxKwh.toFixed(0)}</span><span>{(maxKwh * 0.65).toFixed(0)}</span><span>{(maxKwh * 0.33).toFixed(0)}</span><span>0</span>
                </div>
                <div className="absolute left-10 right-4 top-8 bottom-12">
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0,1,2,3].map(i => <div key={i} className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />)}
                  </div>
                  {chartData.length > 0 ? (
                    <svg className="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="chartLineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2189FF" stopOpacity="0.05" />
                          <stop offset="100%" stopColor="#2189FF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path className="chart-fill" d={fillPath} fill="url(#chartLineGradient)" />
                      <path className="chart-line" d={linePath} fill="none" stroke="#2189FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <g className="chart-interaction-layer">
                        {points.map((pt, i) => (
                          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#2189FF"
                            className="opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-crosshair"
                            title={`${pt.label}: ${pt.kwh} kWh`} />
                        ))}
                      </g>
                    </svg>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-400">
                      No energy data available.
                    </div>
                  )}
                </div>
                <div className="absolute left-10 right-4 bottom-2 flex justify-between text-[10px] font-medium text-gray-400 translate-y-full pt-3">
                  {chartData.map((d, i) => <span key={i}>{d.dayOfWeek?.substring(0, 3) || ''}</span>)}
                </div>
              </div>
            </div>

            {/* Smart Insights */}
            <div className="lg:col-span-4 bg-white rounded-[28px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/80 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center shadow-md">
                  <Bot size={18} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Smart Insights</h3>
              </div>
              <div className="flex flex-col gap-4 flex-1">
                <InsightItem icon={Thermometer} title="Highest Consumer"
                  value={metrics?.highestConsumer?.name || 'N/A'}
                  subtitle={metrics?.highestConsumer ? `${metrics.highestConsumer.percent}%` : '0%'}
                  iconColor="text-orange-500" iconBg="bg-orange-50" />
                <InsightItem icon={Home} title="Most Efficient Room"
                  value={metrics?.mostEfficientRoom || 'N/A'}
                  iconColor="text-green-500" iconBg="bg-green-50" />
                <InsightItem icon={Clock} title="Peak Usage Time"
                  value={metrics?.peakUsageTime || 'N/A'}
                  iconColor="text-purple-500" iconBg="bg-purple-50" />
                <div className="mt-auto pt-4">
                  <div className="bg-gradient-to-r from-blue-50/80 to-[#F7F9FC] border border-blue-100/80 rounded-[18px] p-5 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <TrendingDown size={14} className="text-green-500" /> Potential Monthly Saving
                      </p>
                      <p className="text-[28px] font-extrabold text-[#1428A0] tracking-tighter leading-none">
                        {metrics?.potentialMonthlySaving != null ? `₹${metrics.potentialMonthlySaving}` : '₹0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center text-[#2189FF]">
                      <Zap size={20} className="fill-[#2189FF]/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Donut + Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

            {/* Donut Chart */}
            <div className="bg-white rounded-[28px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/80 flex flex-col sm:flex-row items-center gap-8 lg:gap-12 h-full">
              <div className="flex-1 w-full max-w-[240px]">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Consumption by Device</h3>
                <p className="text-xs font-semibold text-gray-500 mb-8">Breakdown of energy usage by appliance type</p>
                {donutSegments.length > 0 ? (
                  <div className="relative w-full aspect-square">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-md">
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#F0F4F8" strokeWidth="3" />
                      {donutSegments.map((seg, i) => (
                        <circle key={i} cx="18" cy="18" r="15.915" fill="transparent"
                          stroke={seg.color} strokeWidth="3"
                          strokeDasharray={seg.dashArray}
                          strokeDashoffset={seg.dashOffset}
                          className="donut-segment" />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-gray-900 tracking-tighter">100<span className="text-lg">%</span></span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-sm font-semibold text-gray-400">
                    No data available.
                  </div>
                )}
              </div>
              <div className="flex-1 w-full flex flex-col gap-3">
                {donutSegments.length > 0 ? (
                  donutSegments.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                      <span className="text-gray-900 font-bold">{item.percent}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-semibold text-gray-400">No breakdown data.</p>
                )}
              </div>
            </div>

            {/* Bar Chart: Peak Hour */}
            <div className="bg-white rounded-[28px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/80 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Peak Hour Consumption</h3>
                  <p className="text-sm font-semibold text-gray-500 mt-1">Energy distribution across times of day</p>
                </div>
              </div>
              <div className="relative flex-1 w-full min-h-[220px] pt-4">
                <div className="absolute inset-0 flex flex-col justify-between pb-8">
                  {[0,1,2,3].map(i => <div key={i} className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />)}
                </div>
                {peakData.length > 0 ? (
                  <svg className="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                    {barSlots.map((slot, i) => {
                      const period = peakData.find(p => p.period === slot.key)
                      const kwh = period?.kwh || 0
                      const barHeight = maxPeak > 0 ? (kwh / maxPeak) * 85 : 0
                      const y = 100 - barHeight
                      return (
                        <rect key={i} x={slot.x} y={y} width="12" height={barHeight} rx="4"
                          fill={barColors[i]}
                          className="bar-grow transition-colors duration-300 cursor-pointer"
                          style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                          <title>{slot.key}: {kwh.toFixed(2)} kWh</title>
                        </rect>
                      )
                    })}
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-400">
                    No peak hour data.
                  </div>
                )}
                <div className="absolute left-0 right-0 bottom-0 flex justify-around text-[10px] font-medium text-gray-400 translate-y-full pt-3">
                  <span className="w-12 text-center">Morning</span>
                  <span className="w-12 text-center text-[#1428A0]">Afternoon</span>
                  <span className="w-12 text-center text-[#2189FF]">Evening</span>
                  <span className="w-12 text-center">Night</span>
                </div>
              </div>
            </div>
          </div>

          {/* Device Breakdown Table */}
          <div className="bg-white rounded-[28px] premium-shadow ring-1 ring-gray-100/80 overflow-hidden">
            <div className="p-8 lg:px-10 lg:pt-10 lg:pb-8 border-b border-gray-100/80">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Device Breakdown</h3>
              <p className="text-sm font-semibold text-gray-500 mt-1">Detailed energy metrics for all connected appliances</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F9FC] border-b border-gray-200/80">
                    <th className="py-4 px-8 lg:px-10 text-[11px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">Device</th>
                    <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">Status</th>
                    <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">Today&apos;s Usage</th>
                    <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">Monthly Usage</th>
                    <th className="py-4 px-8 lg:px-10 text-[11px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics?.deviceBreakdown || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm font-semibold text-gray-400">No device data available.</td>
                    </tr>
                  ) : (
                    (metrics?.deviceBreakdown || []).map((device, idx) => {
                      const DevIcon = resolveDeviceIcon(device.type)
                      return (
                        <tr key={idx} className="border-b border-gray-100/80 hover:bg-gray-50/50 transition-colors group">
                          <td className="py-4 px-8 lg:px-10 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#F7F9FC] text-[#1428A0] flex items-center justify-center group-hover:bg-[#2189FF]/10 group-hover:text-[#2189FF] transition-colors">
                              <DevIcon size={18} strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-gray-900 text-[14px]">{device.name}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${device.efficiency >= 70 ? 'bg-green-50 text-green-600 ring-1 ring-green-100/50' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200/50'}`}>
                              {device.efficiency >= 70 && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                              {device.efficiency >= 70 ? 'Online' : 'Degraded'}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-gray-700 text-[14px]">{device.todayKwh} kWh</td>
                          <td className="py-4 px-6 font-semibold text-gray-700 text-[14px]">{device.monthlyKwh} kWh</td>
                          <td className="py-4 px-8 lg:px-10">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${device.efficiency >= 90 ? 'bg-green-500' : device.efficiency >= 80 ? 'bg-[#2189FF]' : 'bg-orange-400'}`}
                                  style={{ width: `${device.efficiency}%` }}
                                />
                              </div>
                              <span className="text-[13px] font-bold text-gray-900 min-w-[36px]">{device.efficiency}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-4 pb-8">
            <button className="px-7 py-3.5 rounded-[16px] border-2 border-gray-100 bg-white text-gray-700 font-bold text-[14px] hover:bg-gray-50 hover:border-gray-200 hover:text-gray-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-sm hover:shadow">
              <FileText size={18} strokeWidth={2.5} className="text-gray-400" /> Export CSV
            </button>
            <button className="px-7 py-3.5 rounded-[16px] bg-[#1428A0] text-white font-bold text-[14px] hover:bg-[#102080] transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.35)] active:scale-[0.98] flex items-center justify-center gap-2.5">
              <Download size={18} strokeWidth={2.5} className="text-blue-200" /> Download Report
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
