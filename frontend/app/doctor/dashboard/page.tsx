'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Activity, 
  Stethoscope, 
  Clock, 
  Users, 
  Calendar, 
  LogOut, 
  CheckCircle2, 
  User, 
  Phone, 
  Video, 
  Settings, 
  ArrowRight,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { LiquidButton } from '@/components/ui/button-1'
import { CarePathLogo } from '@/components/brand/carepath-logo'

interface Appointment {
  id: string
  patientId: string
  patientName: string
  patientPhone: string
  date: string
  timeSlot: string
  status: string // 'CONFIRMED' | 'CALLING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED'
  notes?: string
}

export default function DoctorDashboard() {
  const router = useRouter()
  const [doctorName, setDoctorName] = useState<string>('Dr. Ananya Sharma')
  const [doctorId, setDoctorId] = useState<string>('doc-1')
  const [specialty, setSpecialty] = useState<string>('Dermatology')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch Doctor Profile & Appointments
  const loadDoctorData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken') || ''
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      }

      // 1. Fetch Profile
      const profRes = await fetch('/api/doctor/profile', { headers, cache: 'no-store' }).catch(() => null)
      if (profRes && profRes.ok) {
        const profData = await profRes.json()
        const prof = profData.profile || profData.doctor
        if (profData.success && prof) {
          setDoctorName(prof.name || 'Dr. Ananya Sharma')
          setDoctorId(prof.id || 'doc-1')
          setSpecialty(prof.specialty || 'Dermatology')
          setAvatarUrl(prof.avatarUrl || '')
          setIsOnline(prof.isOnline ?? true)
          console.log(`[DOCTOR DASHBOARD] Loaded doctor profile for ${prof.name} (ID: ${prof.id})`)
        }
      }

      // 2. Fetch Appointments
      const aptRes = await fetch('/api/doctor/appointments', { headers, cache: 'no-store' }).catch(() => null)
      if (aptRes && aptRes.ok) {
        const aptData = await aptRes.json()
        if (aptData.success && Array.isArray(aptData.appointments)) {
          setAppointments(aptData.appointments)
        }
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard data', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDoctorData()
  }, [])

  // Socket.io Realtime Listener
  useEffect(() => {
    let socket: Socket | null = null
    try {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      socket = io(socketUrl, { transports: ['websocket', 'polling'] })

      socket.on('connect', () => {
        console.log('⚡ Connected to socket server')
        socket?.emit('join:doctor', doctorId)
      })

      socket.on('appointment:update', (updatedApt: Appointment) => {
        setAppointments((prev) => {
          const exists = prev.some((a) => a.id === updatedApt.id)
          if (exists) {
            return prev.map((a) => (a.id === updatedApt.id ? { ...a, ...updatedApt } : a))
          }
          return [updatedApt, ...prev]
        })
      })
    } catch (err) {
      console.warn('Socket connection fallback active')
    }

    return () => {
      socket?.disconnect()
    }
  }, [doctorId])

  // Toggle Online/Offline Status (Set Offline / Go Online)
  const handleToggleOnlineStatus = async () => {
    setIsTogglingStatus(true)
    setActionMessage(null)
    setErrorMessage(null)

    const newStatus = !isOnline
    try {
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch('/api/doctor/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isOnline: newStatus }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setIsOnline(newStatus)
        setActionMessage(`Practitioner status set to ${newStatus ? 'ONLINE' : 'OFFLINE'}. Patients can now ${newStatus ? 'see and book your available slots' : 'no longer see you in online discovery'}.`)
        setTimeout(() => setActionMessage(null), 4000)
      } else {
        setErrorMessage(data.message || 'Unable to update availability status. Please try again.')
        setTimeout(() => setErrorMessage(null), 4000)
      }
    } catch (err) {
      console.error('Failed to toggle doctor availability status', err)
      setErrorMessage('Unable to change availability. Please check network connection.')
      setTimeout(() => setErrorMessage(null), 4000)
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleCallPatient = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch('/api/queue/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ appointmentId }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: 'CALLING' } : a))
        )
        setActionMessage('Patient called successfully. Waiting room notified.')
        setTimeout(() => setActionMessage(null), 4000)
      } else {
        handleUpdateStatus(appointmentId, 'CALLING')
      }
    } catch (err) {
      handleUpdateStatus(appointmentId, 'CALLING')
    }
  }

  // Update Appointment Status (Call, Start, Complete)
  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
        )
        setActionMessage(`Patient consultation status updated to ${newStatus}`)
        setTimeout(() => setActionMessage(null), 3000)
      }
    } catch (err) {
      console.error('Failed to update appointment status', err)
    }
  }

  // Logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('carepath_session')
      localStorage.removeItem('carepath_role')

      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      document.cookie = 'carepath_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      document.cookie = 'carepath_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'

      router.push('/login')
      router.refresh()
    }
  }

  const activeQueue = appointments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111]">
      
      {/* Header Bar */}
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-4">
            <CarePathLogo size="sm" showTagline={true} />
            <div className="h-8 w-[1px] bg-[#2A2A2A] hidden sm:block"></div>
            <div className="flex flex-col hidden sm:flex">
              <span className="font-bold text-xs text-[#999999] uppercase tracking-wider leading-tight">Doctor Portal</span>
              <span className="text-[10px] text-[#666666]">Practitioner Workspace</span>
            </div>
          </Link>

          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Online Status Toggle (Set Offline / Go Online) */}
            <button
              type="button"
              onClick={handleToggleOnlineStatus}
              disabled={isTogglingStatus}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50 ${
                isOnline
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400 hover:bg-emerald-900'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ONLINE (Click to Set Offline)</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
                  <span>OFFLINE (Click to Go Online)</span>
                </>
              )}
            </button>

            {/* Profile Link */}
            <Link
              href="/doctor/profile"
              className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={doctorName} className="w-8 h-8 rounded-full object-cover border border-red-500/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#EF3030] text-white flex items-center justify-center font-bold text-xs">
                  Dr
                </div>
              )}
              <span className="hidden sm:inline font-semibold text-xs">{doctorName}</span>
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-[#171717] hover:bg-red-950/40 text-[#FF6B6B] font-semibold text-xs transition-colors flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Action Notifications */}
      {actionMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2.5 px-4 text-center transition-all animate-fadeIn shadow-sm">
          ✓ {actionMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#EF3030] text-white text-xs font-semibold py-2.5 px-4 text-center transition-all animate-fadeIn shadow-sm">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome & Status Banner */}
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full bg-[#170808] border border-[#7F1D1D] text-[#FF6B6B] text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Verified Telemedicine Practitioner</span>
              </span>

              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 border ${
                isOnline ? 'bg-emerald-950 text-emerald-400 border-emerald-700' : 'bg-neutral-900 text-neutral-400 border-neutral-700'
              }`}>
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>{isOnline ? '● You are available for appointments' : '⚪ You are currently offline'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {doctorName} 🩺
            </h1>
            <p className="text-xs sm:text-sm text-[#999999]">
              Specialty: <span className="font-semibold text-white">{specialty}</span> · ID: <span className="font-mono text-xs text-red-400">{doctorId}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleToggleOnlineStatus}
              disabled={isTogglingStatus}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer ${
                isOnline
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              }`}
            >
              {isOnline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span>{isTogglingStatus ? 'Updating...' : isOnline ? 'Set Offline' : 'Go Online'}</span>
            </button>

            <Link
              href="/doctor/availability"
              className="px-4 py-2.5 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-semibold text-xs shadow-md shadow-red-500/20 transition-all flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Manage Availability & Slots</span>
            </Link>
          </div>
        </div>

        {/* 1. TODAY'S OVERVIEW STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#666666] uppercase">Total Today</span>
              <Calendar className="w-5 h-5 text-[#EF3030]" />
            </div>
            <div className="text-3xl font-extrabold text-[#111111]">{appointments.length}</div>
            <p className="text-[11px] text-[#888888]">Scheduled consultations</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#666666] uppercase">Waiting Queue</span>
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-[#111111]">{activeQueue.length}</div>
            <p className="text-[11px] text-[#888888]">Patients in queue</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#666666] uppercase">Completed</span>
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div className="text-3xl font-extrabold text-[#111111]">{completedCount}</div>
            <p className="text-[11px] text-[#888888]">Finished sessions</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#666666] uppercase">Next Patient</span>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-base font-extrabold text-[#111111] truncate">
              {activeQueue[0] ? activeQueue[0].patientName : 'No pending calls'}
            </div>
            <p className="text-[11px] text-[#888888]">
              {activeQueue[0] ? `Slot: ${activeQueue[0].timeSlot}` : 'Queue cleared'}
            </p>
          </div>
        </div>

        {/* 2. LIVE CONSULTATION QUEUE */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-sm overflow-hidden space-y-4">
          <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAF9F6]">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-[#EF3030] flex items-center justify-center font-bold">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#111111]">Virtual Patient Queue</h2>
                <p className="text-xs text-[#666666]">Real-time patient bookings & consultation caller</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Realtime Connected</span>
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-[#888888]">Loading active patient queue...</div>
          ) : activeQueue.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-sm text-[#111111]">Queue is currently clear</h3>
              <p className="text-xs text-[#888888]">No waiting patients for this time slot.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {activeQueue.map((apt, index) => (
                <div key={apt.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors">
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-[#111111] font-extrabold flex items-center justify-center text-sm border border-[#E5E5E5]">
                      #{index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-base text-[#111111]">{apt.patientName}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          apt.status === 'CALLING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : apt.status === 'IN_CONSULTATION'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#666666]">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-[#EF3030]" />
                          <span>{apt.timeSlot} ({apt.date})</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-[#999999]" />
                          <span>+91 {apt.patientPhone}</span>
                        </span>
                      </div>

                      {apt.notes && (
                        <p className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded-lg border border-neutral-200 mt-2">
                          <span className="font-semibold text-neutral-800">Reason / Notes:</span> {apt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {apt.status === 'CONFIRMED' ? (
                      <LiquidButton
                        onClick={() => handleCallPatient(apt.id)}
                        icon={<Video className="w-4 h-4" />}
                        className="scale-90"
                      >
                        Call Patient
                      </LiquidButton>
                    ) : (
                      <LiquidButton
                        onClick={() => router.push(`/consultation/${apt.id}?role=DOCTOR`)}
                        icon={<Stethoscope className="w-4 h-4" />}
                        className="scale-90"
                      >
                        Enter Consultation
                      </LiquidButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COMPLETED CONSULTATIONS (Added as requested) */}
        {completedCount > 0 && (
          <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-sm overflow-hidden space-y-4">
            <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between bg-[#F0FDF4]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-[#111111]">Completed Consultations</h2>
                  <p className="text-xs text-[#666666]">Successfully finished patient sessions today</p>
                </div>
              </div>
              <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                {completedCount} Completed
              </div>
            </div>
            
            <div className="divide-y divide-[#E5E5E5]">
              {appointments.filter(a => a.status === 'COMPLETED').map((apt) => (
                <div key={apt.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAFAFA]">
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex flex-shrink-0 items-center justify-center text-[#111111] font-bold border border-[#CCCCCC]">
                      {apt.patientName.charAt(0)}
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-base text-[#111111]">{apt.patientName}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-emerald-100 text-emerald-700 uppercase">
                          COMPLETED
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs font-semibold text-[#888888]">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{apt.timeSlot} ({apt.date})</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. QUICK ACTIONS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href="/doctor/profile"
            className="bg-white rounded-3xl p-6 border border-[#E5E5E5] space-y-3 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#EF3030] flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#111111] group-hover:text-[#EF3030] transition-colors flex items-center justify-between">
              <span>Manage Profile</span>
              <ArrowRight className="w-4 h-4 text-[#999999]" />
            </h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Update your medical qualification, experience, fee, facility, and bio visible to patients.
            </p>
          </Link>

          <Link
            href="/doctor/availability"
            className="bg-white rounded-3xl p-6 border border-[#E5E5E5] space-y-3 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#111111] group-hover:text-emerald-600 transition-colors flex items-center justify-between">
              <span>Manage Availability & Slots</span>
              <ArrowRight className="w-4 h-4 text-[#999999]" />
            </h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Add or remove consultation time slots and toggle online/offline practitioner status.
            </p>
          </Link>

          <Link
            href="/patient/doctors"
            className="bg-white rounded-3xl p-6 border border-[#E5E5E5] space-y-3 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#111111] group-hover:text-purple-600 transition-colors flex items-center justify-between">
              <span>Public Doctor View</span>
              <ArrowRight className="w-4 h-4 text-[#999999]" />
            </h3>
            <p className="text-xs text-[#666666] leading-relaxed">
              Preview how patients see your profile card and slot booking calendar in doctor discovery.
            </p>
          </Link>
        </div>

      </main>
    </div>
  )
}
