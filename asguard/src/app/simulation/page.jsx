'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulation } from '../../context/SimulationContext'
import {
  Zap, IndianRupee, TrendingDown,
  Play, Pause, Leaf, FlaskConical, Loader2,
  FastForward, Activity, SkipBack, SkipForward, ShieldCheck,
  TrendingUp, Clock,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

const CARBON_FACTOR = 0.82 // kg CO₂ per kWh (India CEA grid)
const RATE = 7.5           // ₹ per kWh (TNEB Domestic)

// ─────────────────────────────────────────────────────────────────────────────
// Compute actual accumulated metrics from currentLogs (what's already happened)
// No projection nonsense — this is what the simulation has consumed SO FAR.
// ─────────────────────────────────────────────────────────────────────────────
function computeLiveMetrics(currentLogs, virtualTime, allLogs) {
  const hasStarted = currentLogs.length > 1 // >1 because first log is always loaded at init

  if (!hasStarted) {
    return {
      hasStarted: false,
      kwhConsumed: 0,
      costIncurred: 0,
      carbonKg: 0,
      potentialSaving: 0,
      projectedMonthlyCost: null,
      projectedMonthlyKwh: null,
      daysElapsed: 0,
      deviceBreakdown: [],
      dailyChartData: [],
    }
  }

  // Sum actual values from logs seen so far
  let kwhConsumed = 0
  let costIncurred = 0
  let anomalousCost = 0
  const deviceMap = {} // applianceId → { name, kwh }
  const dayMap    = {} // date → { kwh, optimizedKwh }

  for (const log of currentLogs) {
    const kwh  = Number(log.energyKwh) || 0
    const cost = Number(log.electricityCost) || (kwh * RATE)
    kwhConsumed  += kwh
    costIncurred += cost

    // Anomalous usage for saving estimate
    if (log.aiFlag && log.aiFlag !== 'Normal' || log.thresholdExceeded) {
      anomalousCost += cost
    }

    // Per-device breakdown
    const aid  = log.applianceId
    const name = log.appliance?.name || aid
    if (!deviceMap[aid]) deviceMap[aid] = { name, kwh: 0 }
    deviceMap[aid].kwh += kwh

    // Daily chart
    const date = log.date
    if (date) {
      if (!dayMap[date]) dayMap[date] = { kwh: 0, anomKwh: 0 }
      dayMap[date].kwh += kwh
      if (log.aiFlag && log.aiFlag !== 'Normal' || log.thresholdExceeded) {
        dayMap[date].anomKwh += kwh
      }
    }
  }

  const carbonKg = kwhConsumed * CARBON_FACTOR
  const potentialSaving = anomalousCost * 0.7 // 70% of anomalous cost is recoverable

  // Days elapsed since start of month using virtualTime
  const vDate = new Date(virtualTime)
  const startOfMonth = new Date(Date.UTC(vDate.getUTCFullYear(), vDate.getUTCMonth(), 1))
  const daysElapsed = Math.max(1 / 24, (virtualTime - startOfMonth.getTime()) / 86400000)

  // Project to full month only if meaningful data has flowed in
  const dailyRate = kwhConsumed / daysElapsed
  const projectedMonthlyKwh  = dailyRate * 30
  const projectedMonthlyCost = projectedMonthlyKwh * RATE

  // Top devices sorted by kWh
  const deviceBreakdown = Object.values(deviceMap)
    .sort((a, b) => b.kwh - a.kwh)
    .slice(0, 8)
    .map(d => ({ ...d, kwh: Number(d.kwh.toFixed(3)) }))

  const dailyChartData = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      totalKwh: Number(v.kwh.toFixed(3)),
      optimizedKwh: Number((v.kwh - v.anomKwh * 0.7).toFixed(3)),
    }))

  return {
    hasStarted: true,
    kwhConsumed: Number(kwhConsumed.toFixed(3)),
    costIncurred: Number(costIncurred.toFixed(0)),
    carbonKg: Number(carbonKg.toFixed(1)),
    potentialSaving: Number(potentialSaving.toFixed(0)),
    projectedMonthlyCost: Number(projectedMonthlyCost.toFixed(0)),
    projectedMonthlyKwh: Number(projectedMonthlyKwh.toFixed(1)),
    daysElapsed: Number(daysElapsed.toFixed(2)),
    deviceBreakdown,
    dailyChartData,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Card — shows actual value, and optionally a projected pill
// ─────────────────────────────────────────────────────────────────────────────
function SummaryCard({ title, value, icon: Icon, color, projected, hasStarted }) {
  return (
    <div className="bg-white rounded-[24px] p-6 premium-shadow flex flex-col justify-between h-full ring-1 ring-gray-100/60">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={22} className="text-[#1428A0]" strokeWidth={2.5} />
      </div>
      <div>
        <h4 className={`text-[26px] font-extrabold tracking-tight leading-none mb-1 transition-colors ${
          hasStarted ? 'text-gray-900' : 'text-gray-300'
        }`}>
          {hasStarted ? value : '—'}
        </h4>
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">{title}</p>
        {projected && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#1428A0] text-[10px] font-bold ring-1 ring-blue-100">
            <TrendingUp size={9} />
            {hasStarted ? `Proj. ${projected}` : 'Start sim to project'}
          </span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Simulation Player
// ─────────────────────────────────────────────────────────────────────────────
function InlineSimulationPlayer({ sim }) {
  if (!sim || sim.allLogs.length === 0) {
    return (
      <div className="bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80 flex items-center justify-center h-24">
        <span className="text-sm font-semibold text-gray-400">
          {sim?.isLoading ? 'Loading simulation data from Neon…' : 'No simulation data available.'}
        </span>
      </div>
    )
  }

  const { allLogs, virtualTime, setVirtualTime, isPlaying, setIsPlaying, playbackSpeed, setPlaybackSpeed } = sim

  const minTime  = allLogs[0].timestamp
  const maxTime  = allLogs[allLogs.length - 1].timestamp
  const progress = ((virtualTime - minTime) / (maxTime - minTime)) * 100

  const dateObj  = new Date(virtualTime)
  const dateStr  = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr  = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const handleScrub = (e) => {
    const val = parseFloat(e.target.value)
    setIsPlaying(false)
    setVirtualTime(minTime + ((maxTime - minTime) * (val / 100)))
  }

  const skipAmt = (maxTime - minTime) * 0.05
  const skipBack = () => setVirtualTime(t => Math.max(minTime, t - skipAmt))
  const skipFwd  = () => setVirtualTime(t => Math.min(maxTime, t + skipAmt))
  const reset    = () => { setIsPlaying(false); setVirtualTime(minTime) }

  const speeds = [
    { label: '1 Hr/s',  value: 3600 },
    { label: '1 Day/s', value: 86400 },
    { label: '1 Wk/s',  value: 604800 },
  ]

  return (
    <div className="bg-white rounded-[28px] p-8 premium-shadow ring-1 ring-gray-100/80 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Simulation Playback</h3>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Metrics below update in real time as virtual time advances</p>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={13} className={isPlaying ? 'text-green-500 animate-pulse' : 'text-gray-300'} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isPlaying ? 'text-green-600' : 'text-gray-400'}`}>
            {isPlaying ? 'LIVE' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Clock */}
      <div className="flex items-center justify-center">
        <div className="bg-[#F7F9FC] border border-gray-200 rounded-2xl px-8 py-3 text-center">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">Virtual Time</p>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{dateStr}</p>
          <p className="text-sm font-bold text-gray-500">{timeStr}</p>
        </div>
      </div>

      {/* Scrubber */}
      <div className="space-y-1.5">
        <input
          type="range" min="0" max="100" step="0.05"
          value={progress || 0}
          onChange={handleScrub}
          className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#1428A0]"
        />
        <div className="flex justify-between text-[10px] font-bold text-gray-400">
          <span>{new Date(minTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
          <span>{Math.round(progress || 0)}% complete</span>
          <span>{new Date(maxTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Transport buttons */}
        <div className="flex items-center gap-2.5">
          <button onClick={reset} title="Reset" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors active:scale-95">
            <SkipBack size={16} strokeWidth={2.5} />
          </button>
          <button onClick={skipBack} title="Back 5%" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors active:scale-95">
            <FastForward size={16} strokeWidth={2.5} className="rotate-180" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 rounded-2xl bg-[#1428A0] text-white flex items-center justify-center hover:bg-[#102080] transition-colors shadow-[0_4px_14px_rgba(20,40,160,0.28)] active:scale-95"
          >
            {isPlaying
              ? <Pause fill="currentColor" size={22} />
              : <Play fill="currentColor" size={22} className="ml-0.5" />
            }
          </button>
          <button onClick={skipFwd} title="Forward 5%" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors active:scale-95">
            <FastForward size={16} strokeWidth={2.5} />
          </button>
          <button onClick={() => setVirtualTime(maxTime)} title="Jump to end" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors active:scale-95">
            <SkipForward size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1.5 bg-[#F7F9FC] p-1 rounded-xl border border-gray-100">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-2">Speed</span>
          {speeds.map(s => (
            <button
              key={s.value}
              onClick={() => setPlaybackSpeed(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                playbackSpeed === s.value
                  ? 'bg-[#1428A0] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#1428A0] to-[#2189FF] rounded-full transition-all duration-300"
          style={{ width: `${progress || 0}%` }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Simulation() {
  const router = useRouter()
  const sim    = useSimulation()

  const simBadge = (
    <div className="bg-[#1428A0]/10 text-[#1428A0] p-1.5 rounded-lg shadow-sm">
      <FlaskConical size={16} strokeWidth={2.5} />
    </div>
  )

  // Compute live metrics directly from the live currentLogs — no extrapolation
  const metrics = useMemo(
    () => computeLiveMetrics(sim?.currentLogs || [], sim?.virtualTime, sim?.allLogs || []),
    [sim?.currentLogs, sim?.virtualTime]
  )

  // Build daily chart data from metrics
  const chartData = metrics.dailyChartData
  const maxKwh = chartData.length > 0 ? Math.max(0.001, ...chartData.map(d => d.totalKwh)) : 1

  const buildPath = (keyName) => {
    if (chartData.length === 0) return ''
    const pts = chartData.map((d, i) => ({
      x: chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 50,
      y: 40 - (d[keyName] / maxKwh) * 36,
    }))
    return pts.reduce((p, pt, i) => p + `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '')
  }
  const actualPath    = buildPath('totalKwh')
  const optimizedPath = buildPath('optimizedKwh')
  const fillPath      = actualPath ? `${actualPath} L 100,40 L 0,40 Z` : ''

  if (sim?.isLoading) {
    return (
      <AppLayout>
        <Header title="Simulation Engine" titleExtra={simBadge} subtitle="Fast-forward your energy data and watch policies update in real time." />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 size={36} className="animate-spin text-[#1428A0]" />
            <p className="text-sm font-semibold">Loading simulation dataset from Neon…</p>
            <p className="text-xs text-gray-400">21,600 hourly logs · one-time fetch</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const fmt = (n) => n?.toLocaleString('en-IN') ?? '0'

  return (
    <AppLayout>
      <Header
        title="Simulation Engine"
        titleExtra={simBadge}
        subtitle="Fast-forward your energy data and watch metrics accumulate in real time."
      />

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-12 scroll-smooth">
        <div className="max-w-[1400px] mx-auto pt-4 space-y-6 lg:space-y-8">

          {/* ── PLAYER ─────────────────────────────────────────────── */}
          <InlineSimulationPlayer sim={sim} />

          {/* ── START HINT ─────────────────────────────────────────── */}
          {!metrics.hasStarted && (
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-[#1428A0]">
              <Play size={16} strokeWidth={2.5} />
              <span className="text-sm font-bold">Press Play to start the simulation — metrics will accumulate in real time as appliances consume energy</span>
            </div>
          )}

          {/* ── LIVE METRICS CARDS ──────────────────────────────────── */}
          {/*
            Cards show ACTUAL accumulated values from logs seen so far.
            "Projected" shown as small pill — only appears once simulation is running.
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Cost Incurred So Far"
              value={`₹${fmt(metrics.costIncurred)}`}
              icon={IndianRupee}
              color="bg-blue-50"
              hasStarted={metrics.hasStarted}
              projected={metrics.hasStarted ? `₹${fmt(metrics.projectedMonthlyCost)}/mo` : null}
            />
            <SummaryCard
              title="Energy Consumed"
              value={`${fmt(metrics.kwhConsumed)} kWh`}
              icon={Zap}
              color="bg-orange-50"
              hasStarted={metrics.hasStarted}
              projected={metrics.hasStarted ? `${fmt(metrics.projectedMonthlyKwh)} kWh/mo` : null}
            />
            <SummaryCard
              title="Carbon Emitted"
              value={`${fmt(metrics.carbonKg)} kg CO₂`}
              icon={Leaf}
              color="bg-green-50"
              hasStarted={metrics.hasStarted}
              projected={null}
            />
            <SummaryCard
              title="Potential Saving"
              value={`₹${fmt(metrics.potentialSaving)}`}
              icon={TrendingDown}
              color="bg-purple-50"
              hasStarted={metrics.hasStarted}
              projected={null}
            />
          </div>

          {/* ── CHART + DEVICE BREAKDOWN ────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Energy chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[28px] premium-shadow ring-1 ring-gray-100/80">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Daily Energy Consumption</h3>
                  <p className="text-sm font-semibold text-gray-400 mt-1">
                    {chartData.length > 0
                      ? `${chartData.length} day${chartData.length > 1 ? 's' : ''} of data · ${metrics.daysElapsed.toFixed(1)} days elapsed`
                      : 'Press Play to start accumulating data'}
                  </p>
                </div>
                {metrics.hasStarted && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100">
                    <Activity size={11} className="text-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Live</span>
                  </div>
                )}
              </div>

              {chartData.length > 0 ? (
                <>
                  <svg className="w-full h-48 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <defs>
                      <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2189FF" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#2189FF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={fillPath} fill="url(#simGradient)" />
                    <path d={actualPath}    fill="none" stroke="#2189FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={optimizedPath} fill="none" stroke="#94A3B8" strokeWidth="1"   strokeDasharray="3 2" strokeLinecap="round" />
                    <g>
                      {chartData.map((d, i) => {
                        const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 50
                        const y = 40 - (d.totalKwh / maxKwh) * 36
                        return (
                          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" fill="#2189FF"
                            className="opacity-0 hover:opacity-100 transition-opacity cursor-crosshair">
                            <title>{d.date}: {d.totalKwh} kWh</title>
                          </circle>
                        )
                      })}
                    </g>
                  </svg>
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#2189FF] rounded-full" /><span className="text-xs font-semibold text-gray-500">Actual</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-gray-300 rounded-full" /><span className="text-xs font-semibold text-gray-500">If anomalies fixed</span></div>
                  </div>
                </>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center rounded-2xl bg-[#F7F9FC] border border-gray-100 gap-2">
                  <Clock size={24} className="text-gray-300" />
                  <p className="text-sm font-semibold text-gray-400">Awaiting simulation data…</p>
                </div>
              )}
            </div>

            {/* Device Breakdown */}
            <div className="bg-[#1428A0] text-white p-8 rounded-[28px] flex flex-col gap-4">
              <h3 className="font-bold text-xl">Top Appliances</h3>
              {metrics.deviceBreakdown.length > 0 ? (
                <div className="flex-1 space-y-3">
                  {metrics.deviceBreakdown.map((d, i) => {
                    const pct = metrics.kwhConsumed > 0
                      ? Math.round((d.kwh / metrics.kwhConsumed) * 100) : 0
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-blue-100 truncate max-w-[140px]">{d.name}</span>
                          <span className="font-bold text-white">{d.kwh} kWh</span>
                        </div>
                        <div className="h-1.5 bg-[#2189FF]/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/80 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-blue-200 text-sm text-center">Play the simulation to see device-level consumption data</p>
                </div>
              )}
              <button
                onClick={() => router.push('/automation-rules')}
                className="w-full bg-white text-[#1428A0] py-3.5 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors active:scale-[0.98] mt-2"
              >
                <ShieldCheck size={18} /> Configure Policies
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
