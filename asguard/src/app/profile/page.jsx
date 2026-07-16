'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useSimulation } from '../../context/SimulationContext'
import { db } from '../../firebase/client'
import { doc, updateDoc } from 'firebase/firestore'
import { fetchUserProfile } from '../../firebase/firestoreService'
import {
  User, Mail, MapPin,
  Home, Grid, Wifi,
  Shield, Key, Smartphone, Activity, Zap, Lightbulb, CheckCircle2,
  Edit3, LogOut, Check, Settings, Loader2, AlertTriangle, Calendar,
  Copy, CheckCheck,
} from 'lucide-react'
import Header from '../../components/Header'
import AppLayout from '../../components/AppLayout'

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, colorClass, bgClass }) {
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
      </div>
    </div>
  )
}

function CopyUID({ uid }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(uid)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <Shield size={18} className="text-gray-600 shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-semibold text-gray-900 block">Firebase UID</span>
          <span className="text-xs text-gray-500 font-mono block truncate max-w-[180px]">{uid}</span>
        </div>
      </div>
      <button
        onClick={copy}
        className="ml-3 p-2 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
        title="Copy UID"
      >
        {copied
          ? <CheckCheck size={16} className="text-green-500" />
          : <Copy size={16} className="text-gray-500" />
        }
      </button>
    </div>
  )
}

// ── Profile Page ───────────────────────────────────────────────────────────────

export default function Profile() {
  const router   = useRouter()
  const { currentUser, loading: authLoading, logout } = useAuth()
  const sim      = useSimulation()

  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [userData,     setUserData]     = useState(null)
  const [isEditing,    setIsEditing]    = useState(false)
  const [isSaving,     setIsSaving]     = useState(false)
  const [saveSuccess,  setSaveSuccess]  = useState(false)

  const [name,          setName]          = useState('')
  const [houseName,     setHouseName]     = useState('')
  const [houseLocation, setHouseLocation] = useState('')

  // Derive auth provider label from Firebase currentUser
  const authProvider = useMemo(() => {
    const provider = currentUser?.providerData?.[0]?.providerId || ''
    if (provider.includes('google'))   return 'Google OAuth 2.0'
    if (provider.includes('password')) return 'Email / Password'
    if (provider.includes('github'))   return 'GitHub OAuth'
    return provider || 'Firebase Auth'
  }, [currentUser])

  // Stats derived from SimulationContext — no duplicate Firestore fetch
  const stats = useMemo(() => {
    const logs = sim?.currentLogs ?? []
    if (logs.length === 0) return {
      totalRooms: 0, totalAppliances: 0, totalKwh: '0 kWh',
      totalLogs: 0, anomalyEvents: 0,
    }

    const rooms     = new Set(logs.map(l => l.roomId).filter(Boolean))
    const appliances = new Set(logs.map(l => l.applianceId).filter(Boolean))
    const totalKwh  = logs.reduce((s, l) => s + (Number(l.energyKwh) || 0), 0)
    const anomalies = logs.filter(l => l.aiFlag && l.aiFlag !== 'Normal').length

    const activePolicies = sim?.policies
      ? [
          sim.policies.budgetEnabled,
          sim.policies.peakHourPolicyEnabled,
          sim.policies.unoccupiedPolicyEnabled,
          sim.policies.anomalyPolicyEnabled,
          sim.policies.activeMode !== 'normal',
        ].filter(Boolean).length
      : 0

    return {
      totalRooms:     rooms.size,
      totalAppliances: appliances.size,
      totalKwh:       `${totalKwh.toFixed(1)} kWh`,
      totalLogs:      logs.length,
      anomalyEvents:  anomalies,
      activePolicies,
    }
  }, [sim?.currentLogs, sim?.policies])

  useEffect(() => {
    let isMounted = true
    async function load() {
      if (!currentUser?.uid) { setLoading(false); return }
      setLoading(true); setError(null)
      try {
        const uData = await fetchUserProfile(currentUser.uid)
        if (!uData) { if (isMounted) { setError('User profile not found.'); setLoading(false) }; return }
        const fetched = {
          name:          uData.name || '',
          email:         uData.email || currentUser.email || '',
          photoURL:      uData.photoURL || currentUser.photoURL || '',
          houseName:     uData.houseName || '',
          houseLocation: uData.houseLocation || '',
          createdAt:     uData.createdAt || '',
        }
        if (isMounted) {
          setUserData(fetched)
          setName(fetched.name)
          setHouseName(fetched.houseName)
          setHouseLocation(fetched.houseLocation)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) { setError(`Failed to load profile: ${err.message}`); setLoading(false) }
      }
    }
    load()
    return () => { isMounted = false }
  }, [currentUser?.uid])

  const handleLogout = async () => {
    try { await logout(); router.push('/login') } catch (err) { console.error('Logout failed:', err) }
  }

  const handleSave = async () => {
    if (!currentUser?.uid) return
    setIsSaving(true); setSaveSuccess(false)
    try {
      const now = new Date().toISOString()
      await updateDoc(doc(db, 'users', currentUser.uid), { name, houseName, houseLocation, updatedAt: now })
      setUserData(prev => prev ? { ...prev, name, houseName, houseLocation } : prev)
      setSaveSuccess(true); setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Save profile error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (n) => {
    if (!n) return 'U'
    const parts = n.trim().split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={36} className="animate-spin text-[#1428A0]" />
          <p className="text-sm font-semibold">Loading profile…</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <Header title="Profile" subtitle="Manage your account and smart home settings" />

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-16 scroll-smooth">
        <div className="max-w-[1400px] mx-auto space-y-6 lg:space-y-8">

          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 size={18} /> Profile updated successfully.
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] p-[3px]">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt={userData.name || 'Profile'} className="w-full h-full rounded-full object-cover border-4 border-white" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#1428A0] to-[#2189FF] text-white flex items-center justify-center font-bold text-3xl border-4 border-white">
                    {getInitials(userData?.name)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                {userData?.name || 'User Profile'}
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-6 text-sm font-medium text-gray-500 mb-6 flex-wrap">
                <span className="flex items-center gap-1.5"><Mail size={16} className="text-[#2189FF]" /> {userData?.email || ''}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-500" /> {authProvider} Verified</span>
                {userData?.createdAt && (
                  <span className="flex items-center gap-1.5"><Calendar size={16} className="text-purple-500" /> Joined {new Date(userData.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                )}
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white ring-1 ring-inset ring-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mx-auto md:mx-0"
              >
                <Edit3 size={16} /> {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

            {/* LEFT: Personal Info & Smart Home */}
            <div className="lg:col-span-7 space-y-6 lg:space-y-8">

              {/* Personal Info */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User size={20} className="text-[#1428A0]" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Full Name',  icon: User,    value: name,          setter: setName,          type: 'text',  editable: true },
                    { label: 'Email',      icon: Mail,    value: userData?.email || '', setter: null,    type: 'email', editable: false },
                    { label: 'House Name', icon: Home,    value: houseName,     setter: setHouseName,     type: 'text',  editable: true },
                    { label: 'Location',   icon: MapPin,  value: houseLocation, setter: setHouseLocation, type: 'text',  editable: true },
                  ].map(({ label, icon: Icon, value, setter, type, editable }) => (
                    <div key={label} className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block">{label}</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Icon size={18} /></div>
                        <input
                          type={type}
                          value={value}
                          disabled={!editable || !isEditing}
                          onChange={setter ? (e) => setter(e.target.value) : undefined}
                          className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#2189FF] focus:ring-4 focus:ring-[#2189FF]/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart Home Entities */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Home size={20} className="text-[#1428A0]" /> Smart Home Entities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: Home,    label: 'Household ID',      value: 'HOUSE001' },
                    { icon: MapPin,  label: 'Region',            value: userData?.houseLocation || 'N/A' },
                    { icon: Grid,    label: 'Monitored Rooms',   value: stats.totalRooms > 0 ? `${stats.totalRooms} Rooms` : '—' },
                    { icon: Wifi,    label: 'Connected Devices', value: stats.totalAppliances > 0 ? `${stats.totalAppliances} Appliances` : '—', span: 'md:col-span-2' },
                    { icon: Activity, label: 'Logs Analysed',   value: stats.totalLogs > 0 ? stats.totalLogs.toLocaleString() : '—' },
                  ].map(({ icon: Icon, label, value, span }) => (
                    <div key={label} className={`p-4 rounded-2xl bg-[#F7F9FC] border border-gray-100 flex flex-col gap-2 ${span || ''}`}>
                      <Icon size={18} className="text-[#2189FF]" />
                      <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Security */}
            <div className="lg:col-span-5 space-y-6 lg:space-y-8">

              {/* Security & Auth */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-[#1428A0]" /> Security & Auth
                </h3>
                <div className="space-y-3">
                  {/* Auth session — derived from real Firebase state */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-900">Firebase Auth Session</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase ${currentUser ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {currentUser ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {/* Auth provider — real value from currentUser.providerData */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-900">{authProvider}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md uppercase">
                      LINKED
                    </span>
                  </div>

                  {/* UID with copy button */}
                  {currentUser?.uid && <CopyUID uid={currentUser.uid} />}
                </div>
              </div>

              {/* App Preferences — honest, no fake toggles */}
              <div className="bg-white rounded-[24px] p-8 lg:p-10 premium-shadow ring-1 ring-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Settings size={20} className="text-[#1428A0]" /> App Preferences
                </h3>
                <p className="text-sm text-gray-400 font-medium mb-6">
                  Preference management (notifications, dark mode, language) will be available in a future update.
                </p>
                <div className="space-y-3">
                  {[
                    { label: 'Energy Rate (₹/kWh)', value: '7.0 (TNEB Domestic)', icon: Zap },
                    { label: 'Carbon Factor',        value: '0.82 kg CO₂/kWh',    icon: Activity },
                    { label: 'Data Source',          value: 'Neon PostgreSQL',     icon: Key },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-[#F7F9FC] border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Icon size={16} className="text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row — from SimulationContext */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <StatCard icon={Zap}       label="Energy Analysed (kWh)" value={stats.totalKwh}                        colorClass="text-green-500"   bgClass="bg-green-50" />
            <StatCard icon={Activity}  label="Simulation Records"    value={stats.totalLogs.toLocaleString()}      colorClass="text-[#2189FF]"   bgClass="bg-blue-50" />
            <StatCard icon={Lightbulb} label="Anomaly Events Logged" value={`${stats.anomalyEvents}`}             colorClass="text-orange-500"  bgClass="bg-orange-50" />
          <StatCard icon={Settings}  label="Active Policies"       value={`${stats.activePolicies}`} colorClass="text-[#1428A0]" bgClass="bg-[#1428A0]/10" />
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-8 pt-8 border-t border-gray-200/60 pb-8">
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-6 py-3 rounded-xl transition-all w-full sm:w-auto flex items-center justify-center gap-2 mr-auto"
            >
              <LogOut size={16} /> Sign Out
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#1428A0] hover:bg-[#102080] text-white font-semibold text-sm px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Check size={16} /> Save Changes</>}
              </button>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
