'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { 
  Activity, 
  Clock, 
  User, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw,
  PhoneCall,
  ShieldCheck,
  Building
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { supabase } from '@/lib/supabase'

interface QueueEntry {
  id: string
  appointmentId: string
  doctorId: string
  doctorName: string
  specialty: string
  position: number
  status: 'WAITING' | 'CALLING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED'
  enteredAt: string
}

export default function PatientWaitingRoomPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params?.appointmentId as string

  const [queueEntry, setQueueEntry] = useState<QueueEntry | null>(null)
  const [totalWaiting, setTotalWaiting] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)

  // Helper to extract valid JWT token
  const getValidJwtToken = () => {
    if (typeof window === 'undefined') return ''
    const localToken = localStorage.getItem('accessToken')
    if (localToken && localToken.startsWith('eyJ')) return localToken

    const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/)
    if (match && match[1] && match[1].startsWith('eyJ')) return match[1]

    return ''
  }

  // 1. Join Queue on Mount
  useEffect(() => {
    if (!appointmentId) return

    async function joinQueue() {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const token = getValidJwtToken()
        const res = await fetch('/api/queue/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ appointmentId }),
        })

        if (res.status === 401) {
          setErrorMessage('Session expired. Please log in as a Patient.')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        const data = await res.json()
        if (data.success && data.queueEntry) {
          setQueueEntry(data.queueEntry)
        } else {
          setErrorMessage(data.message || 'Unable to join virtual queue.')
        }
      } catch (err) {
        setErrorMessage('Network error joining queue. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    joinQueue()
  }, [appointmentId, router])

  // 2. Fetch Queue Status Poller & Socket.io Realtime Listener
  useEffect(() => {
    if (!appointmentId) return

    const fetchQueueStatus = async () => {
      try {
        const res = await fetch(`/api/queue/status?appointmentId=${appointmentId}`)
        const data = await res.json()
        if (data.success && data.queueEntry) {
          setQueueEntry(data.queueEntry)
          if (data.totalWaiting) setTotalWaiting(data.totalWaiting)
        }
      } catch (err) {}
    }

    // Initial status fetch
    fetchQueueStatus()

    // Poll every 3 seconds as reliable status fetcher
    const interval = setInterval(fetchQueueStatus, 3000)

    // Supabase Realtime Listener for Queue & Appointment updates
    let channel: any = null
    try {
      channel = supabase.channel(`consultation:${appointmentId}`, {
        config: { broadcast: { self: false } },
      })
      channel
        .on('broadcast', { event: 'queue:update' }, (payload: any) => {
          if (payload.payload?.queueEntry) {
            setQueueEntry(payload.payload.queueEntry)
          } else {
            fetchQueueStatus()
          }
        })
        .on('broadcast', { event: 'appointment:update' }, () => {
          fetchQueueStatus()
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setSocketConnected(true)
          }
        })
    } catch (e) {}

    // Socket.io Realtime Listener fallback
    let socket: Socket | null = null
    try {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      socket = io(socketUrl, { transports: ['websocket', 'polling'] })

      socket.on('connect', () => {
        setSocketConnected(true)
        socket?.emit('join:room', `consultation:${appointmentId}`)
      })

      socket.on('queue:update', (data: any) => {
        if (data?.queueEntry) {
          setQueueEntry(data.queueEntry)
        } else {
          fetchQueueStatus()
        }
      })

      socket.on('appointment:update', (data: any) => {
        if (data?.status === 'CALLING' || data?.status === 'IN_CONSULTATION') {
          fetchQueueStatus()
        }
      })

      socket.on('disconnect', () => {
        setSocketConnected(false)
      })
    } catch (err) {}

    return () => {
      clearInterval(interval)
      if (channel) {
        supabase.removeChannel(channel)
      }
      if (socket) {
        socket.disconnect()
      }
    }
  }, [appointmentId])

  const handleEnterConsultation = () => {
    if (!appointmentId) return
    router.push(`/consultation/${appointmentId}?role=PATIENT`)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] pb-16">
      
      {/* Navbar Header */}
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/patient/dashboard" className="flex items-center space-x-2 text-white hover:text-[#EF3030] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Return to Patient Dashboard</span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-semibold text-white">
              {socketConnected ? 'Live Queue Connected' : 'Queue Active'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        
        {/* Waiting Room Header Banner */}
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 text-white shadow-xl text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800 text-[#EF3030] text-xs font-semibold uppercase tracking-wider">
            <span>CarePath Virtual Waiting Room</span>
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Virtual Consultation Queue
          </h1>

          <p className="text-sm text-[#999999] max-w-lg mx-auto">
            Please keep this page open. Your queue position updates automatically in real time.
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 border border-[#E5E5E5] text-center space-y-4 shadow-sm">
            <RefreshCw className="w-10 h-10 text-[#EF3030] animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#111111]">Entering virtual waiting room...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-white rounded-3xl p-10 border border-red-200 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-[#EF3030] mx-auto" />
            <h3 className="font-bold text-base text-[#111111]">{errorMessage}</h3>
            <Link
              href="/patient/dashboard"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : queueEntry ? (
          <div className="space-y-6">
            
            {/* DOCTOR READY CALLING BANNER */}
            {queueEntry.status === 'CALLING' || queueEntry.status === 'IN_CONSULTATION' ? (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 text-white text-center space-y-4 shadow-xl animate-pulse">
                <div className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <PhoneCall className="w-8 h-8 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black">🔔 Your Doctor is Ready!</h2>
                  <p className="text-xs text-emerald-100 font-medium">
                    {queueEntry.doctorName} is calling you for your consultation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEnterConsultation}
                  className="w-full py-4 rounded-2xl bg-white text-emerald-700 font-extrabold text-sm shadow-xl hover:bg-emerald-50 transition-all uppercase tracking-wider"
                >
                  Join Video Consultation Now
                </button>
              </div>
            ) : null}

            {/* Live Queue Position Card */}
            <div className="bg-white rounded-3xl border border-[#E5E5E5] p-8 shadow-sm text-center space-y-6">
              
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#999999]">Current Position in Queue</span>
                <div className="w-28 h-28 rounded-3xl bg-[#EF3030] text-white flex flex-col items-center justify-center mx-auto shadow-xl shadow-red-500/20">
                  <span className="text-4xl font-black">#{queueEntry.position}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">In Line</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                <span>Status: Waiting for Practitioner</span>
              </div>

              {/* Consultation Details */}
              <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-[#E5E5E5] text-left space-y-3 text-xs text-[#333333]">
                <div className="flex justify-between border-b border-[#E5E5E5] pb-2.5">
                  <span className="font-semibold text-[#666666]">Doctor:</span>
                  <span className="font-bold text-[#111111]">{queueEntry.doctorName}</span>
                </div>
                <div className="flex justify-between border-b border-[#E5E5E5] pb-2.5">
                  <span className="font-semibold text-[#666666]">Specialty:</span>
                  <span className="font-bold text-[#EF3030]">{queueEntry.specialty}</span>
                </div>
                <div className="flex justify-between border-b border-[#E5E5E5] pb-2.5">
                  <span className="font-semibold text-[#666666]">Appointment ID:</span>
                  <span className="font-bold text-[#111111]">{queueEntry.appointmentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#666666]">Total Patients Waiting:</span>
                  <span className="font-bold text-[#111111]">{totalWaiting} patient(s)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleEnterConsultation}
                  className="flex-1 py-3.5 rounded-2xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Enter Video Room</span>
                </button>

                <Link
                  href="/patient/dashboard"
                  className="flex-1 py-3.5 rounded-2xl bg-white border border-[#E5E5E5] text-[#111111] font-semibold text-xs hover:bg-neutral-100 transition-all flex items-center justify-center"
                >
                  Leave Queue
                </Link>
              </div>

            </div>

          </div>
        ) : null}

      </main>
    </div>
  )
}
