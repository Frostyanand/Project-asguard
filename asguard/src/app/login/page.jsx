'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Lightbulb,
  Zap,
  Thermometer,
  Activity,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react'

// ── Local Illustration Component ───────────────────────────────────────────────
function DigitalTwinIllustration() {
  return (
    <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
      {/* Background Soft Glows */}
      <div className="absolute inset-0 bg-blue-50/50 rounded-full blur-3xl opacity-60" />

      {/* Phone emitting scan */}
      <div className="absolute top-4 right-1/4 z-20 animate-float">
        <div className="relative bg-white border-4 border-gray-900 rounded-[14px] w-12 h-24 shadow-xl flex items-center justify-center">
          <div className="absolute top-1 w-4 h-1 bg-gray-200 rounded-full" />
          <Activity size={16} className="text-[#2189FF]" />
          {/* Scan Beam */}
          <div
            className="absolute top-[90%] left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-[#2189FF]/30 to-transparent animate-scan"
            style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
          />
        </div>
      </div>

      {/* Central Wireframe House */}
      <div className="relative z-10 w-64 h-64 mt-16 animate-float-delayed">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
          <path d="M100 20 L180 80 L180 170 L20 170 L20 80 Z" stroke="#2189FF" strokeWidth="1" strokeDasharray="4 4" className="opacity-40" />
          <path d="M100 30 L170 85 L170 160 L30 160 L30 85 Z" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M30 85 L100 120 L170 85" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M100 120 L100 160" stroke="#1428A0" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M65 100 L65 160" stroke="#2189FF" strokeWidth="1" className="opacity-30" />
          <path d="M135 100 L135 160" stroke="#2189FF" strokeWidth="1" className="opacity-30" />
          <path d="M30 120 L100 145 L170 120" stroke="#2189FF" strokeWidth="1" className="opacity-30" />
          <circle cx="100" cy="30" r="4" fill="#2189FF" className="animate-glow" />
          <circle cx="30" cy="85" r="3" fill="#1428A0" />
          <circle cx="170" cy="85" r="3" fill="#1428A0" />
          <circle cx="100" cy="120" r="4" fill="#2189FF" />
          <circle cx="100" cy="160" r="3" fill="#1428A0" />
        </svg>
      </div>

      {/* Floating Cards */}
      <div className="absolute top-24 left-8 bg-white p-3.5 rounded-2xl shadow-xl shadow-blue-900/5 ring-1 ring-black/5 animate-float-slow z-30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
          <Lightbulb size={18} className="text-orange-500" />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-900">Living Room</div>
          <div className="text-[11px] text-gray-500 font-medium mt-0.5">Optimized</div>
        </div>
      </div>

      <div className="absolute bottom-12 right-4 bg-white p-3.5 rounded-2xl shadow-xl shadow-blue-900/5 ring-1 ring-black/5 animate-float z-30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <Thermometer size={18} className="text-[#2189FF]" />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-900">HVAC System</div>
          <div className="text-[11px] text-gray-500 font-medium mt-0.5">72°F · Eco Mode</div>
        </div>
      </div>

      <div className="absolute bottom-24 left-0 bg-white p-3.5 rounded-2xl shadow-xl shadow-blue-900/5 ring-1 ring-black/5 animate-float-delayed z-30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <Zap size={18} className="text-green-500" />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-900">Energy Saved</div>
          <div className="text-[11px] text-green-600 font-semibold mt-0.5">-15% Today</div>
        </div>
      </div>
    </div>
  )
}

// ── Login Page ─────────────────────────────────────────────────────────────────
export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleLogin = (e) => {
    e.preventDefault()
    // TODO: integrate Firebase Auth here
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex w-full bg-[#FFFFFF] text-gray-900 selection:bg-[#2189FF]/20">

      {/* LEFT: Branding & Illustration */}
      <div className="hidden lg:flex lg:w-[55%] flex-col relative px-20 py-16 justify-between">
        <div className="z-10 fade-in-up">
          <h2 className="text-[#1428A0] font-semibold tracking-widest uppercase text-xs mb-4 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#2189FF]" />
            Samsung Innovation Campus
          </h2>
          <h1 className="text-5xl lg:text-[56px] font-bold text-gray-900 tracking-tight leading-[1.15] mb-6">
            ASGUARD <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1428A0] to-[#2189FF]">
              AI Smart Guardian
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-[460px] leading-relaxed font-normal">
            Transform your home into an intelligent Digital Twin and receive AI-powered SmartThings energy recommendations.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center fade-in-up delay-100 my-8">
          <DigitalTwinIllustration />
        </div>

        <div className="flex gap-8 z-10 fade-in-up delay-200">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2189FF] animate-glow" />
            <span className="text-sm text-gray-600 font-medium">SmartThings Connected</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600 font-medium">AI Engine Online</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Login Card */}
      <div className="w-full lg:w-[45%] bg-[#F7F9FC] flex flex-col items-center justify-center relative p-6 sm:p-12 lg:p-24 border-l border-gray-100">
        <div className="w-full max-w-[440px] fade-in-up delay-100">

          {/* Mobile Header */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">ASGUARD</h1>
            <p className="text-base text-gray-500 font-medium">AI Smart Guardian</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[24px] p-8 sm:p-12 shadow-[0_8px_40px_rgb(0,0,0,0.04),0_1px_3px_rgb(0,0,0,0.02)] ring-1 ring-gray-100">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2.5 tracking-tight">Welcome Back</h2>
              <p className="text-gray-500 text-base">Sign in to continue to ASGUARD.</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-2 pb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    className={`w-[18px] h-[18px] rounded-[6px] border flex items-center justify-center transition-all duration-200
                      ${rememberMe ? 'bg-[#1428A0] border-[#1428A0]' : 'border-gray-300 bg-white group-hover:border-[#1428A0]'}`}
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe && <Check size={14} strokeWidth={3} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-600 font-medium select-none">Remember me</span>
                </label>
                <a href="#" className="text-sm font-semibold text-[#1428A0] hover:text-[#2189FF] hover:underline underline-offset-4 transition-all">
                  Forgot Password?
                </a>
              </div>

              {/* Buttons */}
              <div className="space-y-3.5 pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#1428A0] hover:bg-[#102080] text-white font-semibold text-base py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(20,40,160,0.25)] hover:shadow-[0_6px_20px_rgba(20,40,160,0.3)] active:scale-[0.98]"
                >
                  Login
                </button>
                <button
                  type="button"
                  className="w-full bg-white ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:ring-gray-300 text-gray-700 font-semibold text-base py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </form>

            {/* Sign Up */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 font-medium">
                Don&apos;t have an account?{' '}
                <a href="#" className="font-semibold text-[#1428A0] hover:text-[#2189FF] hover:underline underline-offset-4 transition-all">
                  Create Account
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 text-[11px] font-semibold text-gray-400 tracking-widest uppercase fade-in-up delay-300">
          Samsung Innovation Campus
        </div>
      </div>
    </div>
  )
}
