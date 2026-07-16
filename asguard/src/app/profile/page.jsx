'use client'

import {
  User, Mail, MapPin, Map,
  Home, Users, Grid, Wifi, Bell, Moon, Languages, Shield,
  Key, Smartphone, Lock, Activity, Zap, Lightbulb, CheckCircle2,
  Camera, Edit3, LogOut, X, Check, Phone, Building, Flag, Settings, ChevronRight
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Page-local Sub-components ─────────────────────────────────────────────────

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

function SettingRow({ icon: Icon, title, description, active, disabled }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-gray-100 transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          <Icon size={18} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {description && <p className="text-xs text-gray-500 font-medium">{description}</p>}
        </div>
      </div>
      {/* Toggle UI */}
      <div className={`w-11 h-6 rounded-full relative shadow-inner transition-colors ${active ? 'bg-[#2189FF]' : 'bg-gray-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'right-1' : 'left-1'}`} />
      </div>
    </div>
  )
}

// ── Profile Page ─────────────────────────────────────────────────────────────

export default function Profile() {
  return (
    <AppLayout>
      <Header title="Profile" subtitle="Manage your Smart Home account" />

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-16 scroll-smooth">
        <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
          
          {/* PROFILE CARD */}
          <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] p-[3px]">
                <div className="w-full h-full rounded-full bg-gray-50 border-4 border-white overflow-hidden flex items-center justify-center group-hover:opacity-90 transition-opacity">
                  <User size={48} className="text-gray-300" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg ring-1 ring-gray-100 flex items-center justify-center text-gray-600 hover:text-[#2189FF] transition-colors">
                <Camera size={18} />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">John Doe</h2>
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-6 text-sm font-medium text-gray-500 mb-6">
                <span className="flex items-center gap-1.5"><Mail size={16} className="text-[#2189FF]" /> john.doe@example.com</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-500" /> Member since 2024</span>
                <span className="flex items-center gap-1.5"><Shield size={16} className="text-orange-500" /> ID: UID-8A92B</span>
              </div>
              <button className="bg-white ring-1 ring-inset ring-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mx-auto md:mx-0">
                <Edit3 size={16} /> Edit Profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* LEFT COLUMN: Personal Info & Smart Home */}
            <div className="lg:col-span-7 space-y-6 lg:space-y-8">
              
              {/* PERSONAL INFORMATION */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User size={20} className="text-[#1428A0]" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Full Name</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <User size={18} />
                      </div>
                      <input type="text" defaultValue="John Doe" className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Mail size={18} />
                      </div>
                      <input type="email" defaultValue="john.doe@example.com" className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Phone Number</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Phone size={18} />
                      </div>
                      <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Address</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <MapPin size={18} />
                      </div>
                      <input type="text" defaultValue="123 Smart Ave, Apt 4B" className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">City</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Building size={18} />
                      </div>
                      <input type="text" defaultValue="San Francisco" className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">State</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Map size={18} />
                      </div>
                      <input type="text" defaultValue="California" className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 block">Country</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Flag size={18} />
                      </div>
                      <input type="text" defaultValue="United States" className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SMART HOME INFORMATION */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Home size={20} className="text-[#1428A0]" /> Smart Home Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 hover:border-[#2189FF]/30 transition-colors flex flex-col gap-2 group">
                    <Home size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">House Name</span>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-[#1428A0] transition-colors">Doe Residence</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 hover:border-[#2189FF]/30 transition-colors flex flex-col gap-2 group">
                    <MapPin size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Location</span>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-[#1428A0] transition-colors">San Francisco</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 hover:border-[#2189FF]/30 transition-colors flex flex-col gap-2 group">
                    <Users size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Family Members</span>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-[#1428A0] transition-colors">4 Members</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 hover:border-[#2189FF]/30 transition-colors flex flex-col gap-2 group">
                    <Grid size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Total Rooms</span>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-[#1428A0] transition-colors">8 Rooms</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 hover:border-[#2189FF]/30 transition-colors flex flex-col gap-2 group md:col-span-2">
                    <Wifi size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Connected Devices</span>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-[#1428A0] transition-colors">24 Active Devices</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Account Settings & Security */}
            <div className="lg:col-span-5 space-y-6 lg:space-y-8">
              
              {/* ACCOUNT SETTINGS */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Settings size={20} className="text-[#1428A0]" /> Account Settings
                </h3>
                <div className="space-y-3">
                  <SettingRow 
                    icon={Bell} 
                    title="Push Notifications" 
                    description="Alerts for anomalies and tips" 
                    active={true} 
                  />
                  <SettingRow 
                    icon={Moon} 
                    title="Dark Mode" 
                    description="Toggle dark mode UI" 
                    active={false} 
                  />
                  <SettingRow 
                    icon={Languages} 
                    title="Language" 
                    description="English (US)" 
                    active={true} 
                  />
                  <SettingRow 
                    icon={Lock} 
                    title="Privacy Settings" 
                    description="Manage data sharing" 
                    active={true} 
                  />
                </div>
              </div>

              {/* SECURITY */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-[#1428A0]" /> Security
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Key size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-900">Change Password</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Smartphone size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-900">Two-Factor Auth</span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md uppercase tracking-wider">Coming Soon</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Activity size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-900">Connected Devices</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* STATISTICS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <StatCard icon={Zap} label="Total Energy Saved" value="1,240 kWh" colorClass="text-green-500" bgClass="bg-green-50" />
            <StatCard icon={Activity} label="Monthly Consumption" value="380 kWh" colorClass="text-[#2189FF]" bgClass="bg-blue-50" />
            <StatCard icon={Lightbulb} label="AI Recommendations" value="42" colorClass="text-orange-500" bgClass="bg-orange-50" />
            <StatCard icon={Settings} label="Active Automations" value="8" colorClass="text-[#1428A0]" bgClass="bg-[#1428A0]/10" />
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-8 pt-8 border-t border-gray-200/60 pb-8">
            <button className="text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-6 py-3 rounded-xl transition-all w-full sm:w-auto flex items-center justify-center gap-2 mr-auto">
              <LogOut size={16} /> Logout
            </button>
            <button className="bg-white ring-1 ring-inset ring-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm px-8 py-3 rounded-xl transition-all shadow-sm w-full sm:w-auto">
              Cancel
            </button>
            <button className="bg-[#1428A0] hover:bg-[#102080] text-white font-semibold text-sm px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg w-full sm:w-auto flex items-center justify-center gap-2">
              <Check size={16} /> Save Changes
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
