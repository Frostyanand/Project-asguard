'use client'

import {
  Zap,
  IndianRupee,
  Activity,
  TrendingDown,
  TrendingUp,
  Thermometer,
  Lightbulb,
  Tv,
  Flame,
  Refrigerator,
  Fan,
  Download,
  FileText,
  Clock,
  Home,
  Bot,
  BarChart3,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

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

  const devices = [
    { name: 'Samsung WindFree AC', icon: Thermometer, status: 'Online',  today: '4.8 kWh', monthly: '135 kWh', efficiency: 85 },
    { name: 'Smart Lighting',      icon: Lightbulb,   status: 'Online',  today: '1.2 kWh', monthly: '32 kWh',  efficiency: 95 },
    { name: 'Samsung Frame TV',    icon: Tv,          status: 'Online',  today: '0.8 kWh', monthly: '24 kWh',  efficiency: 92 },
    { name: 'Smart Water Heater',  icon: Flame,       status: 'Offline', today: '3.5 kWh', monthly: '98 kWh',  efficiency: 78 },
    { name: 'Refrigerator',        icon: Refrigerator, status: 'Online', today: '2.1 kWh', monthly: '62 kWh',  efficiency: 88 },
    { name: 'Ceiling Fan',         icon: Fan,         status: 'Online',  today: '0.4 kWh', monthly: '12 kWh',  efficiency: 90 },
  ]

  const analyticsBadge = (
    <div className="bg-blue-100 text-[#2189FF] p-1.5 rounded-lg shadow-sm">
      <BarChart3 size={16} strokeWidth={2.5} />
    </div>
  )

  return (
    <AppLayout>
      <Header
        title="Energy Analytics"
        titleExtra={analyticsBadge}
        subtitle="Monitor energy consumption, identify trends, and optimize your smart home."
      />

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-12 scroll-smooth">
        <div className="max-w-[1500px] mx-auto pt-2 space-y-6 lg:space-y-8">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
            <SummaryCard title="Today's Energy Usage"     value="12.8 kWh" icon={Zap}         iconColor="text-orange-500"  iconBg="bg-orange-50"     trend="down" trendValue="2.4%" />
            <SummaryCard title="Today's Cost"             value="₹164"     icon={IndianRupee} iconColor="text-green-600"   iconBg="bg-green-50"      trend="down" trendValue="1.2%" />
            <SummaryCard title="Estimated Monthly Cost"   value="₹4,860"   icon={TrendingUp}  iconColor="text-[#1428A0]"   iconBg="bg-blue-50" />
            <SummaryCard title="Energy Efficiency Score"  value="94 / 100" icon={Activity}    iconColor="text-[#2189FF]"   iconBg="bg-blue-50/50" />
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
                <select className="bg-gray-50 border border-gray-200 hover:bg-gray-100 text-[13px] font-bold text-gray-700 py-2.5 px-4 rounded-xl outline-none appearance-none cursor-pointer transition-colors">
                  <option>This Week</option><option>Last Week</option><option>This Month</option>
                </select>
              </div>
              <div className="relative flex-1 w-full min-h-[260px] pt-8 pb-4">
                <div className="absolute left-0 top-6 bottom-12 flex flex-col justify-between text-[10px] font-medium text-gray-400 w-8">
                  <span>25k</span><span>15k</span><span>5k</span><span>0</span>
                </div>
                <div className="absolute left-10 right-4 top-8 bottom-12">
                  <div className="absolute inset-0 flex flex-col justify-between">
                    <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                    <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                    <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                    <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                  </div>
                  <svg className="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="chartLineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2189FF" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#2189FF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path className="chart-fill" d="M0,80 C3,75 6,85 9,70 C12,55 15,65 18,60 C21,55 24,50 27,45 C30,40 33,50 36,45 C39,40 42,30 45,35 C48,40 51,25 54,30 C57,35 60,20 63,15 C66,10 69,20 72,15 C75,10 78,15 81,10 C84,5 87,15 90,12 C93,10 96,20 100,15 L100,100 L0,100 Z" fill="url(#chartLineGradient)" />
                    <path className="chart-line" d="M0,80 C3,75 6,85 9,70 C12,55 15,65 18,60 C21,55 24,50 27,45 C30,40 33,50 36,45 C39,40 42,30 45,35 C48,40 51,25 54,30 C57,35 60,20 63,15 C66,10 69,20 72,15 C75,10 78,15 81,10 C84,5 87,15 90,12 C93,10 96,20 100,15" fill="none" stroke="#2189FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Hover-only markers for interaction density */}
                    <g className="chart-interaction-layer">
                      {[
                        { cx: 9, cy: 70 }, { cx: 27, cy: 45 }, { cx: 45, cy: 35 }, 
                        { cx: 63, cy: 15 }, { cx: 81, cy: 10 }, { cx: 100, cy: 15 }
                      ].map((pt, i) => (
                        <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="#2189FF" className="opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-crosshair" />
                      ))}
                    </g>
                  </svg>
                </div>
                <div className="absolute left-10 right-4 bottom-2 flex justify-between text-[10px] font-medium text-gray-400 translate-y-full pt-3">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
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
                <InsightItem icon={Thermometer} title="Highest Consumer"   value="Samsung WindFree AC" subtitle="38%" iconColor="text-orange-500" iconBg="bg-orange-50" />
                <InsightItem icon={Home}        title="Most Efficient Room" value="Bedroom"                            iconColor="text-green-500"  iconBg="bg-green-50" />
                <InsightItem icon={Clock}       title="Peak Usage Time"    value="2 PM – 4 PM"                        iconColor="text-purple-500" iconBg="bg-purple-50" />
                <div className="mt-auto pt-4">
                  <div className="bg-gradient-to-r from-blue-50/80 to-[#F7F9FC] border border-blue-100/80 rounded-[18px] p-5 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <TrendingDown size={14} className="text-green-500" /> Potential Monthly Saving
                      </p>
                      <p className="text-[28px] font-extrabold text-[#1428A0] tracking-tighter leading-none">₹420</p>
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
                <p className="text-xs font-semibold text-gray-500 mb-8">Breakdown of today&apos;s total usage</p>
                <div className="relative w-full aspect-square">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-md">
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#F0F4F8" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#1428A0" strokeWidth="3" strokeDasharray="38 62" strokeDashoffset="0"   className="donut-segment" />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#2189FF" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="-38"  className="donut-segment" />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#60A5FA" strokeWidth="3" strokeDasharray="15 85" strokeDashoffset="-58"  className="donut-segment" />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#93C5FD" strokeWidth="3" strokeDasharray="12 88" strokeDashoffset="-73"  className="donut-segment" />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#BFDBFE" strokeWidth="3" strokeDasharray="15 85" strokeDashoffset="-85"  className="donut-segment" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tighter">100<span className="text-lg">%</span></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full flex flex-col gap-3">
                {[
                  { name: 'AC', val: '38%', color: 'bg-[#1428A0]' },
                  { name: 'Lights', val: '20%', color: 'bg-[#2189FF]' },
                  { name: 'TV', val: '15%', color: 'bg-blue-400' },
                  { name: 'Water Heater', val: '12%', color: 'bg-blue-300' },
                  { name: 'Refrigerator', val: '10%', color: 'bg-blue-200' },
                  { name: 'Fan', val: '5%', color: 'bg-blue-100' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm font-semibold">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-gray-900 font-bold">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-[28px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/80 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Peak Hour Consumption</h3>
                  <p className="text-sm font-semibold text-gray-500 mt-1">Energy distribution across times of day</p>
                </div>
              </div>
              <div className="relative flex-1 w-full min-h-[220px] pt-4">
                <div className="absolute inset-0 flex flex-col justify-between pb-8">
                  <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                  <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                  <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                  <div className="w-full border-b" style={{ borderColor: '#E8EDF5', borderWidth: '1px' }} />
                </div>
                <svg className="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <rect x="8"  y="60" width="12" height="40" rx="4" fill="#BFDBFE" className="bar-grow transition-colors duration-300 hover:fill-[#93C5FD] cursor-pointer" style={{ animationDelay: '0.1s' }} />
                  <rect x="33" y="15" width="12" height="85" rx="4" fill="#1428A0" className="bar-grow transition-colors duration-300 hover:fill-[#2189FF] cursor-pointer" style={{ animationDelay: '0.2s' }} />
                  <rect x="58" y="30" width="12" height="70" rx="4" fill="#2189FF" className="bar-grow transition-colors duration-300 hover:fill-[#60A5FA] cursor-pointer" style={{ animationDelay: '0.3s' }} />
                  <rect x="83" y="75" width="12" height="25" rx="4" fill="#93C5FD" className="bar-grow transition-colors duration-300 hover:fill-[#BFDBFE] cursor-pointer" style={{ animationDelay: '0.4s' }} />
                </svg>
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
                  {devices.map((device, idx) => (
                    <tr key={idx} className="border-b border-gray-100/80 hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-8 lg:px-10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F7F9FC] text-[#1428A0] flex items-center justify-center group-hover:bg-[#2189FF]/10 group-hover:text-[#2189FF] transition-colors">
                          <device.icon size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-gray-900 text-[14px]">{device.name}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${device.status === 'Online' ? 'bg-green-50 text-green-600 ring-1 ring-green-100/50' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200/50'}`}>
                          {device.status === 'Online' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                          {device.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-700 text-[14px]">{device.today}</td>
                      <td className="py-4 px-6 font-semibold text-gray-700 text-[14px]">{device.monthly}</td>
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
                  ))}
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
