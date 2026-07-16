'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../firebase/client'
import { doc, updateDoc } from 'firebase/firestore'
import {
  fetchUserProfile,
  fetchLogCount,
  fetchWeeklyLogs,
  getUniqueRooms,
  getUniqueDevices,
  generateAutomationRules,
} from '../../firebase/firestoreService'
import {
  User, Mail, MapPin,
  Home, Grid, Wifi, Bell, Moon, Languages, Shield,
  Key, Smartphone, Lock, Activity, Zap, Lightbulb, CheckCircle2,
  Camera, Edit3, LogOut, Check, Settings, Loader2, AlertTriangle, Calendar
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
      <div className={`w-11 h-6 rounded-full relative shadow-inner transition-colors ${active ? 'bg-[#2189FF]' : 'bg-gray-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'right-1' : 'left-1'}`} />
      </div>
    </div>
  )
}

export default function Profile() {
  const router = useRouter()
  const { currentUser, loading: authLoading, logout } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [userData, setUserData] = useState(null)
  
  // Stats derived from energy_logs
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalAppliances: 0,
    climate: 'Hot and Humid Tropical',
    totalEnergyMonitored: '0 kWh',
    totalLogs: 0,
    anomalyEventsCount: 0,
    activeRulesCount: 0,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [name, setName] = useState('')
  const [houseName, setHouseName] = useState('')
  const [houseLocation, setHouseLocation] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchFirestoreData() {
      if (!currentUser?.uid) {
        if (isMounted) setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Query 1: Read users/{uid}
        const uData = await fetchUserProfile(currentUser.uid)

        if (!uData) {
          if (isMounted) {
            setError(`User document not found in Firestore.`)
            setLoading(false)
          }
          return
        }

        const fetchedUser = {
          name: uData.name || '',
          email: uData.email || currentUser.email || '',
          photoURL: uData.photoURL || currentUser.photoURL || '',
          houseName: uData.houseName || 'Smart Villa Chennai',
          houseLocation: uData.houseLocation || 'Chennai, Tamil Nadu, India',
          createdAt: uData.createdAt || '',
          updatedAt: uData.updatedAt || '',
        }

        if (isMounted) {
          setUserData(fetchedUser)
          setName(fetchedUser.name)
          setHouseName(fetchedUser.houseName)
          setHouseLocation(fetchedUser.houseLocation)
        }

        const houseId = uData.house_id || uData.houseId || 'HOUSE001'

        // Fetch logs to compute profile stats
        const [totalLogCount, weeklyLogs] = await Promise.all([
          fetchLogCount(houseId),
          fetchWeeklyLogs(houseId),
        ])

        const uniqueRooms = getUniqueRooms(weeklyLogs)
        const uniqueDevices = getUniqueDevices(weeklyLogs)
        const rules = generateAutomationRules(weeklyLogs)
        
        const totalEnergy = weeklyLogs.reduce((sum, l) => sum + (Number(l.energy_kwh) || 0), 0)
        const anomalyEvents = weeklyLogs.filter((l) => l.ai_flag !== 'Normal' || l.threshold_exceeded).length
        const latestLog = weeklyLogs[0]
        const derivedClimate = latestLog?.weather ? `${latestLog.weather} Climate` : 'Hot and Humid Tropical'

        if (isMounted) {
          setStats({
            totalRooms: uniqueRooms.length,
            totalAppliances: uniqueDevices.length,
            climate: derivedClimate,
            totalEnergyMonitored: `${totalEnergy.toFixed(1)} kWh`,
            totalLogs: totalLogCount,
            anomalyEventsCount: anomalyEvents,
            activeRulesCount: rules.length,
          })
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching profile data from Firestore:', err)
        if (isMounted) {
          setError(`Failed to load profile data: ${err.message}`)
          setLoading(false)
        }
      }
    }

    fetchFirestoreData()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  const handleSaveChanges = async () => {
    if (!currentUser?.uid) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const now = new Date().toISOString()

      // Update user doc
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        name,
        houseName,
        houseLocation,
        updatedAt: now,
      })

      setUserData((prev) => prev ? { ...prev, name, houseName, houseLocation, updatedAt: now } : prev)

      setSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Save profile error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (userName) => {
    if (!userName) return "U"
    const parts = userName.trim().split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return userName.slice(0, 2).toUpperCase()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={36} className="animate-spin text-[#1428A0]" />
          <p className="text-sm font-semibold">Loading profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <Header title="Profile" subtitle="Manage your Smart Home account & Firebase settings" />

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-16 scroll-smooth">
        <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
          
          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PROFILE CARD */}
          <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] p-[3px]">
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt={userData.name || 'User Profile'}
                    className="w-full h-full rounded-full object-cover border-4 border-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center font-bold text-3xl border-4 border-white">
                    {getInitials(userData?.name)}
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg ring-1 ring-gray-100 flex items-center justify-center text-gray-600 hover:text-[#2189FF] transition-colors">
                <Camera size={18} />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                {userData?.name || 'User Profile'}
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-6 text-sm font-medium text-gray-500 mb-6 flex-wrap">
                <span className="flex items-center gap-1.5"><Mail size={16} className="text-[#2189FF]" /> {userData?.email || ''}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-500" /> SmartThings Auth Synced</span>
                <span className="flex items-center gap-1.5"><Shield size={16} className="text-orange-500" /> UID: {currentUser?.uid ? `${currentUser.uid.substring(0, 8)}...` : ''}</span>
                {userData?.createdAt && (
                  <span className="flex items-center gap-1.5"><Calendar size={16} className="text-purple-500" /> Joined: {new Date(userData.createdAt).toLocaleDateString()}</span>
                )}
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white ring-1 ring-inset ring-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mx-auto md:mx-0"
              >
                <Edit3 size={16} /> {isEditing ? "Cancel Editing" : "Edit Profile"}
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 size={18} /> Profile successfully updated in Firebase!
            </div>
          )}

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
                      <input 
                        type="text" 
                        value={name}
                        disabled={!isEditing}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all disabled:opacity-80" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="email" 
                        value={userData?.email || ''}
                        disabled
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 opacity-70 cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">House Name</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Home size={18} />
                      </div>
                      <input 
                        type="text" 
                        value={houseName}
                        disabled={!isEditing}
                        onChange={(e) => setHouseName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all disabled:opacity-80" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Location</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <MapPin size={18} />
                      </div>
                      <input 
                        type="text" 
                        value={houseLocation}
                        disabled={!isEditing}
                        onChange={(e) => setHouseLocation(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all disabled:opacity-80" 
                      />
                    </div>
                  </div>
                </div>
              </div>
 
              {/* SMART HOME INFORMATION */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Home size={20} className="text-[#1428A0]" /> Smart Home Entities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 flex flex-col gap-2">
                    <Home size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Household ID</span>
                    <span className="text-sm font-semibold text-gray-900">HOUSE001</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 flex flex-col gap-2">
                    <MapPin size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Region</span>
                    <span className="text-sm font-semibold text-gray-900">{userData?.houseLocation || 'N/A'}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 flex flex-col gap-2">
                    <Activity size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Climate</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.climate}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 flex flex-col gap-2">
                    <Grid size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Monitored Rooms</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.totalRooms} Rooms</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 flex flex-col gap-2 md:col-span-2">
                    <Wifi size={18} className="text-[#2189FF]" />
                    <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">Connected IoT Devices</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.totalAppliances} SmartThings Appliances</span>
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
                  <SettingRow icon={Bell} title="Push Notifications" description="Alerts for anomalies and tips" active={true} />
                  <SettingRow icon={Moon} title="Dark Mode" description="Toggle dark mode UI" active={false} />
                  <SettingRow icon={Languages} title="Language" description="English (US)" active={true} />
                  <SettingRow icon={Lock} title="Privacy Settings" description="Manage data sharing" active={true} />
                </div>
              </div>

              {/* SECURITY */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-[#1428A0]" /> Security & Auth
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-900">Firebase Auth Session</span>
                    </div>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-md uppercase">ACTIVE</span>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-900">Google OAuth 2.0</span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md uppercase">ENABLED</span>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield size={18} className="text-gray-600" />
                      <div>
                        <span className="text-sm font-semibold text-gray-900 block">House Owner UID</span>
                        <span className="text-xs text-gray-500 font-mono">{currentUser?.uid || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* STATISTICS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <StatCard icon={Zap} label="Total Energy Monitored" value={stats.totalEnergyMonitored} colorClass="text-green-500" bgClass="bg-green-50" />
            <StatCard icon={Activity} label="Firestore Records Streamed" value={stats.totalLogs.toLocaleString()} colorClass="text-[#2189FF]" bgClass="bg-blue-50" />
            <StatCard icon={Lightbulb} label="AI Anomaly Events" value={`${stats.anomalyEventsCount} Events`} colorClass="text-orange-500" bgClass="bg-orange-50" />
            <StatCard icon={Settings} label="Active Automations" value={`${stats.activeRulesCount} Rules`} colorClass="text-[#1428A0]" bgClass="bg-[#1428A0]/10" />
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-8 pt-8 border-t border-gray-200/60 pb-8">
            <button 
              onClick={handleLogout}
              className="text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-6 py-3 rounded-xl transition-all w-full sm:w-auto flex items-center justify-center gap-2 mr-auto"
            >
              <LogOut size={16} /> Logout
            </button>
            {isEditing && (
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-[#1428A0] hover:bg-[#102080] text-white font-semibold text-sm px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Save Changes
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
