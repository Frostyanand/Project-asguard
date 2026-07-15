'use client'

import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  UploadCloud,
  Film,
  MonitorPlay,
  Play,
  Info,
  ChevronDown,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Page-local Sub-components ─────────────────────────────────────────────────

function FormInput({ label, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 block">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all shadow-sm"
      />
    </div>
  )
}

function FormSelect({ label, options }) {
  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-semibold text-gray-700 block">{label}</label>
      <div className="relative">
        <select className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-base text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all appearance-none cursor-pointer shadow-sm pr-10">
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

function GuidelineItem({ text }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
      <CheckCircle2 size={20} className="text-[#2189FF] shrink-0" />
      <span className="text-sm font-semibold text-gray-700">{text}</span>
    </div>
  )
}

// ── UploadRoomVideo Page ───────────────────────────────────────────────────────
export default function UploadRoomVideo() {
  const router = useRouter()

  const guidelines = [
    'Walk Slowly', 'Keep Camera Stable',
    'Cover Every Wall', 'Avoid Motion Blur',
    'Capture Furniture', 'Maintain Overlapping Views',
  ]

  return (
    <AppLayout>
      <Header
        title="Upload Room Video"
        subtitle="Upload a recorded room walkthrough to generate your Digital Twin."
      />

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-16 scroll-smooth">
        <div className="max-w-[1000px] mx-auto space-y-6 lg:space-y-8 pt-4">

          {/* Section 1: Room Info */}
          <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
            <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Room Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <FormInput label="Room Name" placeholder="e.g. Master Bedroom" />
              <FormSelect label="Room Type" options={['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Office', 'Balcony', 'Custom']} />
              <FormSelect label="Floor" options={['Ground Floor', 'First Floor', 'Second Floor']} />
              <FormSelect label="Approximate Room Size" options={['Small', 'Medium', 'Large']} />
            </div>
          </div>

          {/* Section 2 & 3: Upload + Guidelines */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

            {/* Upload Area */}
            <div className="lg:col-span-8 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 flex flex-col h-full">
              <div className="border-2 border-dashed border-gray-300 rounded-[20px] bg-gray-50/30 hover:bg-[#2189FF]/5 hover:border-[#2189FF]/50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-12 lg:p-16 flex-1 group">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-md">
                  <UploadCloud size={32} className="text-[#1428A0] group-hover:text-[#2189FF] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                  Drag &amp; Drop Video <span className="text-gray-400 font-medium mx-2">or</span>{' '}
                  <span className="text-[#2189FF] group-hover:underline underline-offset-4">Browse Files</span>
                </h3>
                <div className="flex items-center gap-6 mt-8">
                  <div className="text-center">
                    <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">Supported Formats</p>
                    <p className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-sm">MP4, MOV, AVI</p>
                  </div>
                  <div className="w-[1px] h-10 bg-gray-200" />
                  <div className="text-center">
                    <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">Recommended</p>
                    <p className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-md border border-gray-100 shadow-sm">1080p · 30 FPS · 30–60s</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="lg:col-span-4 bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 h-full flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Recording Guidelines</h3>
              <div className="flex flex-col gap-3.5 flex-1 justify-center">
                {guidelines.map((g) => <GuidelineItem key={g} text={g} />)}
              </div>
            </div>
          </div>

          {/* Section 4: Preview */}
          <div className="bg-white rounded-[24px] p-6 lg:p-8 premium-shadow ring-1 ring-gray-100/50 flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:gap-8">
            <div className="w-full sm:w-72 aspect-video bg-gray-900 rounded-[16px] relative overflow-hidden flex items-center justify-center group shadow-md shrink-0 ring-1 ring-gray-900/10">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
                alt="Room Preview"
                className="opacity-50 group-hover:opacity-40 transition-opacity object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 z-10 group-hover:scale-110 transition-transform cursor-pointer shadow-lg">
                <Play size={24} className="text-white fill-white ml-1" />
              </div>
            </div>
            <div className="flex-1 w-full flex flex-col justify-center h-full sm:py-2">
              <h4 className="text-xl font-bold text-gray-900 tracking-tight mb-5">living_room.mp4</h4>
              <div className="flex flex-wrap gap-4 mb-6">
                <span className="bg-gray-50 border border-gray-200/80 text-gray-700 px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 shadow-sm">
                  <Film size={18} className="text-gray-400" /> 42 sec
                </span>
                <span className="bg-gray-50 border border-gray-200/80 text-gray-700 px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 shadow-sm">
                  <MonitorPlay size={18} className="text-gray-400" /> 1920×1080
                </span>
              </div>
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200/60 text-green-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm w-max">
                <CheckCircle2 size={18} className="text-green-500" /> Ready for Processing
              </div>
            </div>
          </div>

          {/* Section 5: Actions */}
          <div className="pt-6">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push('/generating')}
                className="px-8 py-4 rounded-xl bg-[#1428A0] text-white font-bold hover:bg-[#102080] shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.3)] transition-all active:scale-[0.98]"
              >
                Generate Digital Twin
              </button>
            </div>
            <p className="text-center text-[13px] font-semibold text-gray-400 mt-10 mb-2 flex items-center justify-center gap-2">
              <Info size={16} />
              The uploaded video will be securely processed to reconstruct a 3D Digital Twin using AI-powered photogrammetry.
            </p>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
