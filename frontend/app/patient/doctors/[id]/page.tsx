'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  CheckCircle2, 
  Star, 
  ShieldCheck, 
  Globe, 
  Building, 
  Clock, 
  Calendar,
  AlertCircle
} from 'lucide-react'

interface Doctor {
  id: string
  name: string
  specialty: string
  qualification?: string
  registrationNo?: string
  experienceYrs: number
  languages: string[]
  consultationFee: number
  rating: number
  bio?: string
  facilityName?: string
  isVerified: boolean
  isOnline: boolean
  availableSlots: string[]
}

export default function PatientDoctorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDoctor() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/doctors/${id}`)
        const data = await res.json()
        if (data.success && data.doctor) {
          setDoctor(data.doctor)
        }
      } catch (err) {
        console.error('Failed to load doctor profile', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDoctor()
  }, [id])

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111]">
      {/* Header */}
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/patient/doctors" className="flex items-center space-x-2 text-white hover:text-[#EF3030] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back to Doctor Directory</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-[#666666] bg-white rounded-3xl border border-[#E5E5E5]">
            Loading doctor profile...
          </div>
        ) : !doctor ? (
          <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-[#E5E5E5]">
            <AlertCircle className="w-10 h-10 text-[#999999] mx-auto" />
            <h3 className="font-bold text-base text-[#111111]">Doctor Profile Not Found</h3>
            <Link
              href="/patient/doctors"
              className="inline-block px-4 py-2 rounded-xl bg-[#EF3030] text-white text-xs font-bold"
            >
              Return to Doctor List
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-xl space-y-8">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#E5E5E5]">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EF3030] to-[#B91C1C] text-white font-extrabold text-2xl flex items-center justify-center shadow-lg">
                  {doctor.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold text-[#111111]">{doctor.name}</h1>
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  </div>
                  <p className="text-sm font-semibold text-[#EF3030]">{doctor.specialty} · {doctor.qualification || 'MBBS, MD'}</p>
                  <p className="text-xs text-[#666666]">{doctor.experienceYrs} years experience · Reg: {doctor.registrationNo || 'MCI-884920'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl text-amber-800 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{doctor.rating} / 5.0 Rating</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#333333]">
              <div className="space-y-3 p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#999999]">Consultation Info</h3>
                <div className="flex justify-between border-b border-[#E5E5E5] pb-2">
                  <span className="text-[#666666]">Fee:</span>
                  <span className="font-bold text-[#111111]">₹{doctor.consultationFee}</span>
                </div>
                <div className="flex justify-between border-b border-[#E5E5E5] pb-2">
                  <span className="text-[#666666]">Facility:</span>
                  <span className="font-bold text-[#111111]">{doctor.facilityName || 'CarePath Central Hospital'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Spoken Languages:</span>
                  <span className="font-bold text-[#111111]">{doctor.languages.join(', ')}</span>
                </div>
              </div>

              <div className="space-y-3 p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#999999]">About Doctor</h3>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {doctor.bio || 'Experienced medical consultant providing evidence-based healthcare and patient consultations.'}
                </p>
              </div>
            </div>

            {/* Booking CTA */}
            <div className="pt-6 border-t border-[#E5E5E5] flex justify-end">
              <Link
                href="/patient/doctors"
                className="px-8 py-3.5 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-sm shadow-md shadow-red-500/20 transition-all inline-flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment Slot</span>
              </Link>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
