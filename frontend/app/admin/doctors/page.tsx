'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, ShieldCheck, Stethoscope, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'

interface PendingDoctor {
  id: string
  specialty: string
  user: {
    name: string
    email: string | null
    phone: string
  }
}

export default function AdminVerifyDoctors() {
  const [doctors, setDoctors] = useState<PendingDoctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPendingDoctors()
  }, [])

  const fetchPendingDoctors = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/admin/doctors/pending')
      if (res.data.success) {
        setDoctors(res.data.doctors)
      }
    } catch (err) {
      setError('Failed to fetch pending doctors.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (id: string) => {
    setError('')
    setSuccess('')
    setVerifyingId(id)

    try {
      const res = await api.post(`/admin/doctors/${id}/verify`)
      if (res.data.success) {
        setSuccess('Doctor successfully verified.')
        setDoctors((prev) => prev.filter(d => d.id !== id))
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-neutral-950 text-[#111111] dark:text-neutral-50 pb-12">
      
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center space-x-2 text-white hover:text-[#EF3030] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back to Dashboard</span>
          </Link>

          <div className="flex items-center space-x-2 text-white">
            <div className="w-9 h-9 rounded-xl bg-[#EF3030] flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">Doctor Verification</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E5] space-y-4 shadow-sm">
          <div className="flex items-center space-x-3 text-[#EF3030]">
            <ShieldCheck className="w-6 h-6" />
            <h1 className="text-2xl font-bold text-[#111111]">Pending Approvals</h1>
          </div>
          <p className="text-sm text-[#666666]">
            Review credentials and verify doctors so they can start consulting patients on the platform.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-start space-x-3 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 flex items-start space-x-3 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-[#888888] flex flex-col items-center">
            <Activity className="w-8 h-8 animate-spin mb-4 text-[#EF3030]" />
            Loading pending doctors...
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E5E5E5] p-12 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-[#111111]">All Caught Up!</h3>
            <p className="text-sm text-[#666666]">There are no doctors pending verification at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-2xl p-6 border border-[#E5E5E5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-[#111111]">{doctor.user.name}</h3>
                  <div className="flex flex-wrap items-center text-sm gap-2">
                    <span className="font-semibold text-[#EF3030] bg-red-50 px-2 py-0.5 rounded-md">
                      {doctor.specialty}
                    </span>
                    <span className="text-[#666666]">| {doctor.user.phone}</span>
                    {doctor.user.email && <span className="text-[#666666]">| {doctor.user.email}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleVerify(doctor.id)}
                    disabled={verifyingId === doctor.id}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {verifyingId === doctor.id ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Approve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
