'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, ArrowLeft, History, FileText, Calendar as CalendarIcon, Clock, Stethoscope } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'

interface HistoryRecord {
  id: string
  date: string
  timeSlot: string
  status: string
  doctor: {
    specialty: string
    user: {
      name: string
    }
  }
  facility?: {
    name: string
  }
  consultation?: {
    id: string
    notes?: string
    prescriptions: any[]
  }
}

export default function PatientHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/consultations/history')
      if (res.data.success) {
        setHistory(res.data.history)
      }
    } catch (err) {
      setError('Failed to fetch consultation history.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-neutral-950 text-[#111111] dark:text-neutral-50 pb-12">
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/patient/dashboard" className="flex items-center space-x-2 text-white hover:text-[#EF3030] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#EF3030] flex items-center justify-center text-white">
              <History className="w-4 h-4" />
            </div>
            <span className="font-bold text-white">Consultation History</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center space-x-3 text-[#EF3030] mb-2">
            <History className="w-6 h-6" />
            <h1 className="text-2xl font-bold text-[#111111]">Past Consultations</h1>
          </div>
          <p className="text-sm text-[#666666]">
            Review your past appointments, clinical notes, and issued prescriptions.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 font-medium border border-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-[#888888] flex flex-col items-center">
            <Activity className="w-8 h-8 animate-spin mb-4 text-[#EF3030]" />
            Loading your medical history...
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E5E5E5] p-12 text-center shadow-sm space-y-3">
            <History className="w-12 h-12 text-neutral-300 mx-auto" />
            <h3 className="font-bold text-lg text-[#111111]">No Past Consultations</h3>
            <p className="text-sm text-[#666666]">You haven't completed any consultations yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl p-6 border border-[#E5E5E5] shadow-sm flex flex-col md:flex-row gap-6">
                
                {/* Left Side: Appointment Info */}
                <div className="md:w-1/3 space-y-4 border-b md:border-b-0 md:border-r border-[#E5E5E5] pb-6 md:pb-0 md:pr-6">
                  <div>
                    <h3 className="font-bold text-lg text-[#111111]">{record.doctor.user.name}</h3>
                    <div className="text-sm font-semibold text-[#EF3030] flex items-center gap-1.5 mt-1">
                      <Stethoscope className="w-4 h-4" />
                      {record.doctor.specialty}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-[#666666]">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {record.timeSlot}
                    </div>
                    {record.facility && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {record.facility.name}
                      </div>
                    )}
                  </div>
                  
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold uppercase">
                    {record.status}
                  </span>
                </div>

                {/* Right Side: Notes & Prescriptions */}
                <div className="md:w-2/3 space-y-6">
                  {record.consultation?.notes ? (
                    <div>
                      <h4 className="font-bold text-[#111111] mb-2 flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Clinical Notes
                      </h4>
                      <div className="p-4 bg-[#F9FAFB] rounded-xl text-sm text-[#444444] leading-relaxed border border-[#F3F4F6]">
                        {record.consultation.notes}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[#888888] italic">No clinical notes provided for this consultation.</div>
                  )}

                  {record.consultation?.prescriptions && record.consultation.prescriptions.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#111111] mb-3 text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        Prescriptions Issued
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {record.consultation.prescriptions.map((rx) => (
                          <div key={rx.id} className="p-3 border border-emerald-100 bg-emerald-50/50 rounded-xl flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-800">
                              Prescription • {new Date(rx.createdAt).toLocaleDateString()}
                            </span>
                            {rx.isIssued && (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  alert('PDF viewing will be available soon.');
                                }}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 underline"
                              >
                                View PDF
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
