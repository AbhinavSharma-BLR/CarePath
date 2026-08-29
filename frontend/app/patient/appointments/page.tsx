'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Activity, 
  Video, 
  AlertCircle,
  Plus
} from 'lucide-react'

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

export default function PatientAppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getValidJwtToken = () => {
    if (typeof window === 'undefined') return ''
    const localToken = localStorage.getItem('accessToken')
    if (localToken && localToken.startsWith('eyJ')) return localToken

    const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/)
    if (match && match[1] && match[1].startsWith('eyJ')) return match[1]

    return ''
  }

  useEffect(() => {
    async function fetchAppointments() {
      setIsLoading(true)
      try {
        const token = getValidJwtToken()
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        }

        const res = await fetch('/api/appointments', { headers }).catch(() => null)
        if (res && res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.appointments)) {
            setAppointments(data.appointments)
          }
        }
      } catch (err) {
        console.error('Failed to load appointments', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] pb-12">
      {/* Header */}
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/patient/dashboard" className="flex items-center space-x-2 text-white hover:text-[#EF3030] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back to Dashboard</span>
          </Link>

          <Link
            href="/patient/doctors"
            className="px-4 py-2 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-md shadow-red-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Banner */}
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#EF3030]" />
              <h1 className="text-2xl font-bold">My Consultations</h1>
            </div>
            <p className="text-xs text-[#999999]">Manage your upcoming and past medical consultations</p>
          </div>

          <Link
            href="/patient/doctors"
            className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-xs shadow-md"
          >
            Find Doctor
          </Link>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#666666] bg-white rounded-3xl border border-[#E5E5E5]">
            Loading your appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-[#E5E5E5] border-dashed">
            <Clock className="w-10 h-10 text-[#999999] mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#111111]">No appointments booked yet</h3>
              <p className="text-xs text-[#666666]">Explore our certified doctors and select your consultation slot.</p>
            </div>
            <Link
              href="/patient/doctors"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-xs shadow-md shadow-red-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment Now</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-3xl p-6 border border-[#E5E5E5] hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg text-[#111111]">{apt.doctorName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
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

                  <p className="text-xs font-semibold text-[#EF3030]">{apt.specialty}</p>

                  <div className="flex items-center space-x-4 text-xs text-[#666666]">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#999999]" />
                      <span>{apt.date}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#EF3030]" />
                      <span>{apt.timeSlot}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs text-[#888888] font-mono">ID: {apt.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
