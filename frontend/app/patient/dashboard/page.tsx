'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Activity, 
  Calendar, 
  Search, 
  Clock, 
  User, 
  ShieldCheck, 
  Video, 
  LogOut,
  Bell,
  CheckCircle2,
  Stethoscope
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { motion } from 'framer-motion'
import { LiquidButton } from '@/components/ui/button-1'
import { CarePathLogo } from '@/components/brand/carepath-logo'

interface Appointment {
  id: string
  doctorId: string
  doctorName: string
  specialty: string
  date: string
  timeSlot: string
  status: string
  notes?: string
}

export default function PatientDashboard() {
  const router = useRouter()
  const [patientName, setPatientName] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])

  // Helper for guaranteed navigation
  const navigateToDoctors = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    router.push('/patient/doctors')
  }

  const getValidJwtToken = () => {
    if (typeof window === 'undefined') return ''
    const localToken = localStorage.getItem('accessToken')
    if (localToken && localToken.startsWith('eyJ')) return localToken

    const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/)
    if (match && match[1] && match[1].startsWith('eyJ')) return match[1]

    return ''
  }

  // Fetch Patient Profile & Appointments
  useEffect(() => {
    async function loadPatientData() {
      setIsLoading(true)
      try {
        const token = getValidJwtToken()
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        }

        const [profRes, aptRes, rxRes] = await Promise.all([
          fetch('/api/patient/profile', { headers, cache: 'no-store' }).catch(() => null),
          fetch('/api/appointments', { headers, cache: 'no-store' }).catch(() => null),
          fetch('/api/prescriptions', { headers, cache: 'no-store' }).catch(() => null)
        ])

        // 1. Process Profile
        let fetchedName: string | null = null
        if (profRes && profRes.ok) {
          const profData = await profRes.json()
          if (profData.success && profData.patient) {
            const p = profData.patient
            fetchedName = p.name || p.user?.name || null
            setPatientId(p.id || p.userId || '')
            if (p.avatarUrl) setAvatarUrl(p.avatarUrl)
          }
        }

        // Secondary fallback to /api/me if profile did not return name
        if (!fetchedName) {
          const meRes = await fetch('/api/me', { headers }).catch(() => null)
          if (meRes && meRes.ok) {
            const meData = await meRes.json()
            if (meData.user?.name) {
              fetchedName = meData.user.name
            }
          }
        }

        if (fetchedName) {
          setPatientName(fetchedName)
        }

        // 2. Process Appointments
        if (aptRes && aptRes.ok) {
          const aptData = await aptRes.json()
          if (aptData.success && Array.isArray(aptData.appointments)) {
            setAppointments(aptData.appointments)
          }
        }

        // 3. Process Prescriptions
        if (rxRes && rxRes.ok) {
          const rxData = await rxRes.json()
          if (rxData.success && Array.isArray(rxData.prescriptions)) {
            setPrescriptions(rxData.prescriptions)
          }
        }
      } catch (err) {
        console.error('Failed to load patient dashboard data', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadPatientData()
  }, [])

  // Push Notifications Setup
  useEffect(() => {
    async function setupNotifications() {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            console.log('[FCM] Notification permission granted.')
            // In a real app, generate the FCM token here and send it to the backend
            // const token = await getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' })
            // await fetch('/api/patient/fcm-token', { method: 'POST', body: JSON.stringify({ token }) })
          }
        }
      }
    }
    setupNotifications()
  }, [])

  // Real-time Socket Listener
  useEffect(() => {
    let socket: Socket | null = null
    try {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      socket = io(socketUrl, { transports: ['websocket', 'polling'] })

      socket.on('connect', () => {
        if (patientId) socket?.emit('join:patient', patientId)
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
    } catch (err) {}

    return () => {
      socket?.disconnect()
    }
  }, [patientId])

  // Logout Handler
  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
    
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'carepath_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'carepath_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.clear()
    window.location.href = '/login'
  }

  const initialLetter = patientName ? patientName.trim()[0].toUpperCase() : 'P'

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-neutral-950 text-[#111111] dark:text-neutral-50 pb-12">
      
      {/* Dashboard Header */}
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-4">
            <CarePathLogo size="sm" showTagline={true} />
            <div className="h-8 w-[1px] bg-[#2A2A2A] hidden sm:block"></div>
            <span className="font-bold text-xs text-[#999999] hidden sm:block uppercase tracking-wider">Patient Portal</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              href="/patient/profile"
              className="flex items-center space-x-2 text-sm font-medium text-white hover:text-[#EF3030] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#EF3030] text-white flex items-center justify-center font-bold text-xs overflow-hidden border border-white/20">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              <span className="hidden sm:inline font-semibold">{patientName || 'My Profile'}</span>
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3.5 py-1.5 rounded-xl border border-red-500/30 bg-[#171717] hover:bg-red-950/40 text-[#FF6B6B] font-semibold text-xs transition-colors flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        
        {/* Welcome Card */}
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 text-white shadow-xl">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-[#170808] border border-[#7F1D1D] text-[#FF6B6B] text-xs font-semibold uppercase tracking-wider">
                Patient Portal Active
              </span>
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isLoading || !patientName ? (
                <span>Welcome to CarePath+ 👋</span>
              ) : (
                <span>Welcome to CarePath+, {patientName} 👋</span>
              )}
            </h1>

            <p className="text-sm sm:text-base text-[#999999] leading-relaxed">
              Search for certified doctors, manage your medical profile, and prepare for instant telemedicine consultations.
            </p>

            <div className="pt-2 flex flex-wrap gap-3 relative z-10">
              {/* BUTTON 1: Top "Find & Book Doctor" hero button */}
              <LiquidButton
                onClick={navigateToDoctors}
              >
                Find & Book Doctor
              </LiquidButton>
              <Link
                href="/patient/profile"
                className="px-5 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-[#111111] font-semibold text-sm hover:bg-neutral-100 transition-colors cursor-pointer relative z-10"
              >
                Manage Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Real-time Appointments Section */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-[#EF3030] flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#111111]">Your Booked Consultations</h2>
                <p className="text-xs text-[#666666]">Live status updates from your assigned doctors</p>
              </div>
            </div>
            
            {/* BUTTON 2: "Book New Appointment" button */}
            <LiquidButton
              onClick={navigateToDoctors}
              className="scale-90"
            >
              Book New Appointment
            </LiquidButton>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#888888]">Loading appointments...</div>
          ) : appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length === 0 ? (
            <div className="p-8 text-center space-y-3 border border-dashed border-[#E5E5E5] rounded-2xl">
              <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="font-bold text-sm text-[#111111]">No upcoming appointments</h3>
              <p className="text-xs text-[#888888]">Explore our certified doctor directory and book your slot.</p>
              
              {/* BUTTON 3: Lower "Find & Book Doctor" empty-state button */}
              <LiquidButton
                onClick={navigateToDoctors}
              >
                Find & Book Doctor
              </LiquidButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').map((apt) => (
                <div key={apt.id} className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3 hover:border-red-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-[#111111]">{apt.doctorName}</h4>
                      <p className="text-xs font-semibold text-[#EF3030]">{apt.specialty}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      apt.status === 'CALLING'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                        : apt.status === 'IN_CONSULTATION'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                        : apt.status === 'COMPLETED'
                        ? 'bg-neutral-100 text-neutral-700'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#666666] pt-2 border-t border-[#E5E5E5]">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-[#EF3030]" />
                      <span>{apt.timeSlot} ({apt.date})</span>
                    </div>

                    {apt.status === 'CALLING' && (
                      <span className="text-xs font-bold text-amber-700 animate-bounce">
                        📞 Doctor is calling you...
                      </span>
                    )}
                  </div>

                  {/* Join Virtual Queue or Completed Banner */}
                  {apt.status === 'COMPLETED' || apt.status === 'ENDED' ? (
                    <div className="pt-2">
                      <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>✓ Call Completed</span>
                      </div>
                    </div>
                  ) : apt.status !== 'CANCELLED' ? (
                    <div className="pt-2">
                      <LiquidButton
                        onClick={() => router.push(`/patient/waiting-room/${apt.id}`)}
                        icon={<Video className="w-5 h-5" />}
                        className="w-full"
                      >
                        {apt.status === 'CALLING' ? 'Doctor Calling — Enter' : 'Join Virtual Queue'}
                      </LiquidButton>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COMPLETED CONSULTATIONS (Added as requested) */}
        {appointments.filter(a => a.status === 'COMPLETED').length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-[#111111]">Completed Consultations</h2>
                  <p className="text-xs text-[#666666]">History of your finished appointments</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {appointments.filter(a => a.status === 'COMPLETED').map((apt) => (
                <div key={apt.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl">
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex flex-shrink-0 items-center justify-center text-[#111111] font-bold border border-[#CCCCCC]">
                      {apt.doctorName.charAt(4) || 'D'}
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-base text-[#111111]">{apt.doctorName}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-emerald-100 text-emerald-700 uppercase">
                          COMPLETED
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs font-semibold text-[#888888]">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{apt.timeSlot} ({apt.date})</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>{apt.specialty}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prescriptions Section */}
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#111111]">Your Prescriptions</h2>
                <p className="text-xs text-[#666666]">Access issued prescriptions and medical documents</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#888888]">Loading prescriptions...</div>
          ) : prescriptions.length === 0 ? (
            <div className="p-8 text-center space-y-3 border border-dashed border-[#E5E5E5] rounded-2xl">
              <h3 className="font-bold text-sm text-[#111111]">No prescriptions found</h3>
              <p className="text-xs text-[#888888]">Prescriptions issued by your doctors will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map((rx: any) => (
                <div key={rx.id} className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3 hover:border-blue-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-[#111111]">
                        {rx.doctor?.user?.name || 'Doctor'}
                      </h4>
                      <p className="text-xs font-semibold text-[#EF3030]">
                        {new Date(rx.issuedAt || rx.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      rx.isIssued 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      {rx.isIssued ? 'Issued' : 'Draft'}
                    </span>
                  </div>

                  <div className="pt-2 text-xs text-[#666666] line-clamp-2">
                    <span className="font-semibold text-black">Medicines:</span> {rx.items.map((i: any) => i.medicineName).join(', ')}
                  </div>

                  {rx.isIssued && (
                    <div className="pt-3 border-t border-[#E5E5E5] flex gap-2">
                      <button 
                        type="button" 
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/prescriptions/${rx.id}/pdf`, {
                              headers: {
                                authorization: `Bearer ${getValidJwtToken()}`
                              }
                            });
                            const data = await res.json();
                            if (data.success && data.downloadUrl) {
                              window.open(data.downloadUrl, '_blank');
                            } else {
                              alert('PDF not available.');
                            }
                          } catch(err) {
                            alert('Error opening PDF');
                          }
                        }}
                        className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        View / Download PDF
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/patient/doctors"
            onClick={navigateToDoctors}
            className="bg-white rounded-2xl p-6 border border-[#E5E5E5] hover:shadow-md hover:border-red-300 transition-all flex flex-col justify-between cursor-pointer relative z-10 pointer-events-auto"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#EF3030] flex items-center justify-center mb-4">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1 text-[#111111]">Find Doctor</h3>
              <p className="text-xs text-[#666666]">Search by specialty, language & availability</p>
            </div>
          </Link>

          <Link
            href="/patient/profile"
            className="bg-white rounded-2xl p-6 border border-[#E5E5E5] hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between cursor-pointer relative z-10"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1 text-[#111111]">Medical Profile</h3>
              <p className="text-xs text-[#666666]">Private encrypted health records & avatar</p>
            </div>
          </Link>

          <Link
            href="/patient/doctors"
            onClick={navigateToDoctors}
            className="bg-white rounded-2xl p-6 border border-[#E5E5E5] hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between cursor-pointer relative z-10 pointer-events-auto"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1 text-[#111111]">Virtual Consultation</h3>
              <p className="text-xs text-[#666666]">Encrypted HD video call & prescription</p>
            </div>
          </Link>
        </div>

      </motion.main>
    </div>
  )
}
