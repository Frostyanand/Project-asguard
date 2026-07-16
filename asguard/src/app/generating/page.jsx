'use client'

import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Loader2,
  Circle,
  Clock,
  Info,
  ChevronRight,
  FileVideo,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── GeneratingTwin Page ────────────────────────────────────────────────────────
export default function GeneratingTwin() {
  const router = useRouter()

  const processingSteps = [
    { label: 'Video Uploaded',               status: 'done' },
    { label: 'Frame Extraction',             status: 'done' },
    { label: 'Feature Detection',            status: 'done' },
    { label: 'Feature Matching',             status: 'done' },
    { label: 'Camera Pose Estimation',       status: 'active' },
    { label: 'Dense Point Cloud Generation', status: 'waiting' },
    { label: 'Mesh Reconstruction',          status: 'waiting' },
    { label: 'Mesh Optimization',            status: 'waiting' },
    { label: 'Preparing Digital Twin',       status: 'waiting' },
  ]

  return (
    <AppLayout>
      <Header
        title="Generating Digital Twin"
        subtitle="Your uploaded room video is being processed. This may take a few moments."
      />

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-16 scroll-smooth">
        <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8 pt-4">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8 h-full">

              {/* Hero Progress Card */}
              <div className="bg-white rounded-[24px] p-8 lg:p-12 premium-shadow ring-1 ring-gray-100/50 flex flex-col items-center justify-center relative overflow-hidden flex-1 min-h-[420px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2189FF] rounded-full blur-[100px] opacity-[0.06] pointer-events-none" />

                {/* Circular Progress */}
                <div className="relative w-64 h-64 lg:w-72 lg:h-72 mb-10">
                  <svg className="w-full h-full drop-shadow-xl" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#F0F4F8" strokeWidth="8" />
                    <circle
                      className="progress-ring__circle"
                      cx="80" cy="80" r="70"
                      fill="none"
                      stroke="url(#blueGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1428A0" />
                        <stop offset="100%" stopColor="#2189FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-extrabold text-gray-900 tracking-tighter">72%</span>
                    <span className="text-xs font-bold tracking-widest uppercase text-[#2189FF] mt-2">Progress</span>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center z-10">
                  <h3 className="text-2xl lg:text-[26px] font-bold text-gray-900 mb-4 tracking-tight flex items-center justify-center gap-3">
                    <Loader2 size={26} className="text-[#2189FF] animate-spin" />
                    Reconstructing 3D Environment...
                  </h3>
                  <div className="inline-flex items-center gap-2.5 bg-blue-50/80 border border-blue-100 text-[#1428A0] px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm">
                    <Clock size={16} strokeWidth={2.5} />
                    Estimated Remaining Time: <span className="font-bold">1 minute 20 seconds</span>
                  </div>
                </div>
              </div>

              {/* Pipeline Card */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h4 className="text-[13px] font-bold tracking-widest uppercase text-gray-500 mb-10 ml-1">AI Reconstruction Pipeline</h4>
                <div className="relative flex justify-between items-center px-2 sm:px-8">
                  <div className="absolute left-10 right-10 top-[28px] h-[2px] bg-gray-100 z-0" />
                  <div className="absolute left-10 right-[50%] top-[28px] h-[2px] animated-dashed-line z-0" />

                  {[
                    { icon: FileVideo, label: 'Video',             bg: 'bg-green-50 border border-green-100', iconCls: 'text-green-600',    dim: false },
                    { icon: Cpu,       label: 'AI Reconstruction', bg: 'bg-[#1428A0] shadow-lg shadow-blue-900/20', iconCls: 'text-white', dim: false, pulse: true },
                    { icon: Layers,    label: 'Wireframe',         bg: 'bg-gray-50 border border-gray-200',   iconCls: 'text-gray-400',    dim: true },
                    { icon: Sparkles,  label: 'Digital Twin',      bg: 'bg-gray-50 border border-gray-200',   iconCls: 'text-gray-400',    dim: true },
                  ].map(({ icon: Icon, label, bg, iconCls, dim, pulse }) => (
                    <div key={label} className={`flex flex-col items-center gap-4 relative z-10 bg-white px-3 ${dim ? 'opacity-50' : ''}`}>
                      <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-[18px] flex items-center justify-center ${bg} ${pulse ? 'pulse-glow' : ''}`}>
                        <Icon size={24} className={iconCls} />
                      </div>
                      <span className={`text-sm font-bold ${dim ? 'text-gray-500' : pulse ? 'text-[#1428A0]' : 'text-gray-700'}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8 h-full">

              {/* Processing Timeline */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 flex-1">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-8">Processing Timeline</h3>
                <div className="relative pl-2 space-y-7">
                  <div className="absolute left-[23px] top-3 bottom-3 w-[2px] bg-gray-100 z-0" />
                  {processingSteps.map((step, index) => (
                    <div key={index} className="relative flex items-start gap-5">
                      <div className="relative z-10 flex items-center justify-center w-[30px] h-[30px] bg-white rounded-full flex-shrink-0 mt-[-2px]">
                        {step.status === 'done' && <CheckCircle2 size={24} className="text-green-500 fill-green-50" />}
                        {step.status === 'active' && (
                          <div className="w-6 h-6 rounded-full border-2 border-[#2189FF] flex items-center justify-center relative bg-white">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#2189FF] animate-pulse" />
                            <div className="absolute inset-0 rounded-full border-2 border-[#2189FF] animate-ping opacity-25" />
                          </div>
                        )}
                        {step.status === 'waiting' && <Circle size={22} className="text-gray-200 fill-gray-50" />}
                      </div>
                      <div className="pt-[1px]">
                        <p className={`text-sm font-bold ${step.status === 'done' ? 'text-gray-900' : step.status === 'active' ? 'text-[#1428A0]' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {step.status === 'active'   && <p className="text-xs font-semibold text-[#2189FF] mt-1.5">Currently Processing...</p>}
                        {step.status === 'waiting'  && <p className="text-xs font-medium text-gray-400 mt-1.5">Waiting</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-[#F0F4F8]/80 border border-blue-100/60 rounded-[24px] p-6 lg:p-8 flex gap-5 premium-shadow">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-blue-100/50 text-[#1428A0] flex items-center justify-center ring-4 ring-white shadow-sm">
                    <Info size={20} strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2 leading-tight">Processing is completely automatic.</h4>
                  <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                    Our AI reconstructs your room into a high-quality Digital Twin using advanced computer vision and photogrammetry.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="pt-2 pb-6">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
              <button
                onClick={() => router.push('/upload')}
                className="px-8 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98]"
              >
                Cancel
              </button>
              <button className="px-8 py-3.5 rounded-xl bg-white border border-[#2189FF]/30 text-[#1428A0] font-bold hover:bg-blue-50 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2">
                Background Processing
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
