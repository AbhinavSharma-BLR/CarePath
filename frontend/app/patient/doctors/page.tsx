'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Activity, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Star, 
  Building, 
  Globe, 
  AlertCircle,
  ArrowLeft,
  Award,
  RefreshCw
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
  avatarUrl?: string
  isVerified: boolean
  isOnline: boolean
  status: 'ONLINE' | 'BUSY' | 'OFFLINE'
  nextAvailable?: string
  availableSlots: string[]
}

interface SummaryData {
  totalDoctors: number
  onlineCount: number
  availableTodayCount: number
}

interface BookedAppointment {
  id: string
  doctorName: string
  specialty: string
  date: string
  timeSlot: string
  status: string
}

export default function PatientDoctorDiscoveryPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [summary, setSummary] = useState<SummaryData>({ totalDoctors: 0, onlineCount: 0, availableTodayCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  
  // Filters & Sorting (Default: All Doctors)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [onlineOnlyFilter, setOnlineOnlyFilter] = useState(false)
  const [availableTodayFilter, setAvailableTodayFilter] = useState(false)
  const [sortOption, setSortOption] = useState<'default' | 'fee_low' | 'fee_high' | 'rating'>('default')

  // Slot Picker Modal State
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isFetchingSlots, setIsFetchingSlots] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookedAppointment, setBookedAppointment] = useState<BookedAppointment | null>(null)

  // Date Generator for Slot Picker (Today + 3 upcoming days)
  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 4; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const iso = d.toISOString().split('T')[0]
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      dates.push({ iso, label })
    }
    return dates
  }

  const dateOptions = generateDates()

  // Initialize selected date
  useEffect(() => {
    if (dateOptions.length > 0 && !selectedDate) {
      setSelectedDate(dateOptions[0].iso)
    }
  }, [])

  // Fetch Doctors List
  const fetchDoctors = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const queryParams = new URLSearchParams()
      if (selectedSpecialty !== 'All') queryParams.set('specialty', selectedSpecialty)
      if (selectedLanguage !== 'All') queryParams.set('language', selectedLanguage)
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim())
      if (onlineOnlyFilter) queryParams.set('onlineOnly', 'true')
      if (availableTodayFilter) queryParams.set('availableToday', 'true')
      if (sortOption !== 'default') queryParams.set('sort', sortOption)

      const res = await fetch(`/api/doctors?${queryParams.toString()}`)
      
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`)
      }

      const data = await res.json()

      if (data.success && Array.isArray(data.doctors)) {
        setDoctors(data.doctors)
        if (data.summary) {
          setSummary(data.summary)
        } else {
          setSummary({
            totalDoctors: data.doctors.length,
            onlineCount: data.doctors.filter((d: Doctor) => d.isOnline).length,
            availableTodayCount: data.doctors.filter((d: Doctor) => d.availableSlots && d.availableSlots.length > 0).length,
          })
        }
      } else {
        setDoctors([])
        setFetchError(data.message || 'Unable to retrieve doctor roster.')
      }
    } catch (err: any) {
      console.error('Failed to load doctors', err)
      setFetchError('Unable to load doctors. Please check network connection.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [selectedSpecialty, selectedLanguage, searchQuery, onlineOnlyFilter, availableTodayFilter, sortOption])

  // Fetch Availability for Selected Doctor & Date
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return
    const docId = selectedDoctor.id

    async function fetchAvailability() {
      setIsFetchingSlots(true)
      setSelectedSlot(null)
      try {
        const res = await fetch(`/api/doctors/${docId}/availability?date=${selectedDate}`)
        const data = await res.json()

        if (data.success) {
          setAvailableSlots(data.allSlots || ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM'])
          setBookedSlots(data.bookedSlots || [])
        }
      } catch (err) {
        console.error('Failed to load availability', err)
      } finally {
        setIsFetchingSlots(false)
      }
    }

    fetchAvailability()
  }, [selectedDoctor, selectedDate])

  // Helper to extract valid JWT token
  const getValidJwtToken = () => {
    if (typeof window === 'undefined') return ''
    const localToken = localStorage.getItem('accessToken')
    if (localToken && localToken.startsWith('eyJ')) return localToken

    const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/)
    if (match && match[1] && match[1].startsWith('eyJ')) return match[1]

    return ''
  }

  // Handle appointment booking
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) return

    setIsBooking(true)
    setBookingError(null)

    // Optimistic UI Update
    const optimisticApt = {
      id: `apt-${Date.now()}`,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      date: selectedDate,
      timeSlot: selectedSlot,
      status: 'CONFIRMED',
    }
    setBookedAppointment(optimisticApt)
    setIsBooking(false)

    try {
      const token = getValidJwtToken()
      fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          date: selectedDate,
          timeSlot: selectedSlot,
        }),
        keepalive: true,
      }).then(async (res) => {
        if (res.status === 409) {
          setBookingError('Slot Unavailable. This slot has already been booked by another patient. Please choose another time slot.')
          setBookedSlots(prev => [...prev, selectedSlot])
          setSelectedSlot(null)
          setBookedAppointment(null)
        } else if (res.status === 401) {
          setBookingError('Authentication session expired. Please log in again as a Patient.')
          setBookedAppointment(null)
        } else if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setBookingError(data.message || 'Failed to book appointment.')
          setBookedAppointment(null)
        }
      }).catch(err => {
        setBookingError('Network error while booking appointment.')
        setBookedAppointment(null)
      })

    } catch (err) {
      setBookingError('Unexpected error while booking appointment.')
      setBookedAppointment(null)
    }
  }

  // Clear all active filters
  const handleResetFilters = () => {
    setSelectedSpecialty('All')
    setSelectedLanguage('All')
    setSearchQuery('')
    setOnlineOnlyFilter(false)
    setAvailableTodayFilter(false)
    setSortOption('default')
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] pb-16">
      
      {/* Navbar Header */}
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/patient/dashboard" className="flex items-center space-x-2 text-white hover:text-[#EF3030] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back to Patient Dashboard</span>
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              href="/patient/appointments"
              className="px-3.5 py-1.5 rounded-xl border border-[#333333] bg-[#1A1A1A] hover:border-[#EF3030] text-white text-xs font-semibold transition-all"
            >
              My Appointments
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Banner */}
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-red-950/60 border border-red-800 text-[#EF3030] text-xs font-semibold uppercase tracking-wider">
              CarePath+ Telemedicine Network
            </span>
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Find a Doctor</h1>
            <p className="text-sm text-[#999999] max-w-2xl leading-relaxed">
              Connect with verified doctors available for online consultation.
            </p>
          </div>

          {/* Dynamic Summary Stats Bar */}
          <div className="pt-3 border-t border-[#2A2A2A] flex flex-wrap gap-3 text-xs font-bold">
            <button
              onClick={() => { setOnlineOnlyFilter(false); setAvailableTodayFilter(false); }}
              className="px-3.5 py-1.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-white flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#EF3030]" />
              <span>{summary.totalDoctors} Doctors Available</span>
            </button>

            <button
              onClick={() => { setOnlineOnlyFilter(true); setAvailableTodayFilter(false); }}
              className={`px-3.5 py-1.5 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer ${
                onlineOnlyFilter
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{summary.onlineCount} Online Now</span>
            </button>

            <button
              onClick={() => { setAvailableTodayFilter(true); setOnlineOnlyFilter(false); }}
              className={`px-3.5 py-1.5 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer ${
                availableTodayFilter
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-blue-950/60 border-blue-800 text-blue-300 hover:bg-blue-900/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{summary.availableTodayCount} Available Today</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] shadow-sm space-y-4">
          
          {/* Top Row: Search & Specialty Dropdown & Sort */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-[#999999] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by doctor name or specialization..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
              />
            </div>

            {/* Specialization Filter */}
            <div>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
              >
                <option value="All">All Specializations</option>
                <option value="General Physician">General Physician</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Dermatology">Dermatologist</option>
                <option value="Pediatrician">Pediatrician</option>
                <option value="Orthopedic">Orthopedic</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="ENT Specialist">ENT Specialist</option>
                <option value="Psychiatrist">Psychiatrist</option>
                <option value="Ophthalmologist">Ophthalmologist</option>
              </select>
            </div>

            {/* Sort Option */}
            <div>
              <select
                value={sortOption}
                onChange={(e: any) => setSortOption(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
              >
                <option value="default">Priority Order (Online & Available)</option>
                <option value="rating">Highest Rated</option>
                <option value="fee_low">Lowest Consultation Fee</option>
                <option value="fee_high">Highest Consultation Fee</option>
              </select>
            </div>

          </div>

          {/* Quick Toggle Filter Pills */}
          <div className="pt-2 border-t border-[#F0F0F0] flex flex-wrap items-center gap-2 text-xs font-semibold">
            <button
              onClick={handleResetFilters}
              className={`px-3.5 py-1.5 rounded-xl border transition-all ${
                !onlineOnlyFilter && !availableTodayFilter && selectedSpecialty === 'All' && selectedLanguage === 'All' && !searchQuery
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-[#FAFAFA] text-[#555555] border-[#E5E5E5] hover:border-neutral-300'
              }`}
            >
              All Doctors ({summary.totalDoctors})
            </button>

            <button
              onClick={() => setOnlineOnlyFilter(!onlineOnlyFilter)}
              className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
                onlineOnlyFilter
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-[#FAFAFA] text-emerald-700 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Online Now ({summary.onlineCount})</span>
            </button>

            <button
              onClick={() => setAvailableTodayFilter(!availableTodayFilter)}
              className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
                availableTodayFilter
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-[#FAFAFA] text-blue-700 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Available Today ({summary.availableTodayCount})</span>
            </button>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-medium text-[#111111] focus:outline-none"
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Telugu">Telugu</option>
              <option value="Kannada">Kannada</option>
              <option value="Tamil">Tamil</option>
              <option value="Bengali">Bengali</option>
              <option value="Marathi">Marathi</option>
              <option value="Gujarati">Gujarati</option>
            </select>

          </div>

        </div>

        {/* Doctor Grid or Loading / Error / Empty States */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-[#666666] font-medium bg-white rounded-3xl border border-[#E5E5E5] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#EF3030] animate-spin mx-auto" />
            <p className="font-bold text-[#111111]">Loading doctors...</p>
          </div>
        ) : fetchError ? (
          <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-red-200">
            <AlertCircle className="w-10 h-10 text-[#EF3030] mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#111111]">Unable to load doctors</h3>
              <p className="text-xs text-[#666666]">{fetchError}</p>
            </div>
            <button
              onClick={fetchDoctors}
              className="px-4 py-2 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white text-xs font-bold shadow-sm inline-flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-[#E5E5E5]">
            <AlertCircle className="w-10 h-10 text-[#999999] mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#111111]">
                {searchQuery
                  ? `No doctors match your search for "${searchQuery}"`
                  : onlineOnlyFilter
                  ? 'No doctors are online right now.'
                  : availableTodayFilter
                  ? 'No doctors have available appointments today.'
                  : selectedSpecialty !== 'All'
                  ? `No doctors found in ${selectedSpecialty}.`
                  : 'No doctors are registered yet.'}
              </h3>
              <p className="text-xs text-[#666666]">
                {onlineOnlyFilter
                  ? 'Try clearing the "Online Now" filter to view offline doctors.'
                  : 'Try adjusting your search criteria or clearing active filters.'}
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold shadow-sm"
            >
              Show All Doctors ({summary.totalDoctors})
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doc => {
              const statusPill = doc.isOnline
                ? { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Online' }
                : doc.status === 'BUSY'
                ? { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', label: 'Busy' }
                : { bg: 'bg-neutral-100 text-neutral-600 border-neutral-200', dot: 'bg-neutral-400', label: 'Offline' }

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl p-6 border border-[#E5E5E5] hover:shadow-xl hover:border-red-300 transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    
                    {/* Top Row: Doctor Avatar + Name + Rating */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EF3030] to-[#B91C1C] text-white font-extrabold text-lg flex items-center justify-center shadow-md overflow-hidden">
                          {doc.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={doc.avatarUrl} alt={doc.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{doc.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h3 className="font-bold text-base text-[#111111]">{doc.name}</h3>
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                          </div>
                          <p className="text-xs font-semibold text-[#EF3030]">{doc.specialty}</p>
                          <p className="text-[11px] text-[#666666]">{doc.qualification || 'MBBS, MD'} · {doc.experienceYrs} yrs exp</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-amber-700 text-xs font-bold flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{doc.rating}</span>
                      </div>
                    </div>

                    {/* Status & Next Available Pills */}
                    <div className="flex items-center space-x-2 text-xs font-semibold pt-1">
                      <span className={`px-2.5 py-1 rounded-full border flex items-center space-x-1.5 ${statusPill.bg}`}>
                        <div className={`w-2 h-2 rounded-full ${statusPill.dot}`} />
                        <span>{statusPill.label}</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] text-[#555555] flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#EF3030]" />
                        <span>{doc.nextAvailable || 'Today, 10:00 AM'}</span>
                      </span>
                    </div>

                    {/* Bio */}
                    {doc.bio && (
                      <p className="text-xs text-[#555555] line-clamp-2 leading-relaxed">
                        {doc.bio}
                      </p>
                    )}

                    {/* Facility & Spoken Languages */}
                    <div className="space-y-1.5 pt-2 border-t border-[#F0F0F0] text-xs text-[#666666]">
                      <div className="flex items-center space-x-2">
                        <Building className="w-3.5 h-3.5 text-[#999999] flex-shrink-0" />
                        <span className="truncate">{doc.facilityName || 'CarePath+ Central Hospital'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-3.5 h-3.5 text-[#999999] flex-shrink-0" />
                        <span className="truncate">{doc.languages.join(', ')}</span>
                      </div>
                    </div>

                  </div>

                  {/* Footer Fee & Action Buttons */}
                  <div className="pt-4 border-t border-[#F0F0F0] flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-[#999999]">Fee</span>
                      <span className="text-base font-bold text-[#111111]">₹{doc.consultationFee}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/patient/doctors/${doc.id}`}
                        className="px-3 py-2 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] hover:bg-neutral-200 text-[#111111] font-semibold text-xs transition-colors"
                      >
                        View Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setSelectedDoctor(doc); setBookedAppointment(null); setBookingError(null) }}
                        className="px-3.5 py-2 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-semibold text-xs transition-colors shadow-sm shadow-red-500/20"
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </main>

      {/* SLOT PICKER & BOOKING MODAL */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-[#E5E5E5] shadow-2xl animate-fadeIn">
            
            {/* Modal Header */}
            <div className="bg-[#171717] p-5 text-white flex items-center justify-between border-b border-[#2A2A2A]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#EF3030] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                  {selectedDoctor.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedDoctor.avatarUrl} alt={selectedDoctor.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>DR</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedDoctor.name}</h3>
                  <p className="text-xs text-[#EF3030] font-semibold">{selectedDoctor.specialty} · ₹{selectedDoctor.consultationFee}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="p-1.5 rounded-full hover:bg-[#2A2A2A] text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* SUCCESS CONFIRMATION SCREEN */}
              {bookedAppointment ? (
                <div className="text-center py-6 space-y-5">
                  <div className="w-20 h-20 bg-[#16A34A] text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-[#111111]">✓ Appointment Booked</h2>
                    <p className="text-xs text-[#666666]">Your virtual consultation has been confirmed.</p>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-[#F7F7F7] rounded-2xl p-4 border border-[#E5E5E5] text-left space-y-2.5 text-xs text-[#333333]">
                    <div className="flex justify-between border-b border-[#E5E5E5] pb-2">
                      <span className="font-semibold text-[#666666]">Appointment ID:</span>
                      <span className="font-bold text-[#111111]">{bookedAppointment.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E5E5] pb-2">
                      <span className="font-semibold text-[#666666]">Doctor:</span>
                      <span className="font-bold text-[#111111]">{bookedAppointment.doctorName} ({bookedAppointment.specialty})</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E5E5] pb-2">
                      <span className="font-semibold text-[#666666]">Date:</span>
                      <span className="font-bold text-[#111111]">{bookedAppointment.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#666666]">Time Slot:</span>
                      <span className="font-bold text-[#EF3030]">{bookedAppointment.timeSlot}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => router.push('/patient/appointments')}
                      className="py-3 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all"
                    >
                      My Appointments
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedDoctor(null); setBookedAppointment(null); }}
                      className="py-3 rounded-xl bg-[#111111] text-white font-semibold text-xs hover:bg-[#222222] transition-all"
                    >
                      Book Another Doctor
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Error Alert */}
                  {bookingError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-2.5 text-red-800 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 text-[#EF3030] flex-shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Date Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                      1. Select Consultation Date
                    </label>

                    <div className="grid grid-cols-4 gap-2">
                      {dateOptions.map(opt => (
                        <button
                          type="button"
                          key={opt.iso}
                          onClick={() => setSelectedDate(opt.iso)}
                          className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                            selectedDate === opt.iso
                              ? 'bg-[#EF3030] text-white border-[#EF3030] font-bold shadow-md shadow-red-500/20'
                              : 'bg-white text-[#333333] border-[#E5E5E5] hover:border-red-200 text-xs font-medium'
                          }`}
                        >
                          <span className="block text-[10px] opacity-80">{opt.label}</span>
                          <span className="block text-xs font-bold mt-0.5">{opt.iso.split('-').slice(1).join('/')}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slot Picker Grid */}
                  <div className="space-y-2 pt-2 border-t border-[#E5E5E5]">
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider flex justify-between items-center">
                      <span>2. Select Available Time Slot</span>
                      {isFetchingSlots && <span className="text-[10px] text-[#999999]">Loading slots...</span>}
                    </label>

                    <div className="grid grid-cols-3 gap-2.5">
                      {availableSlots.map(slot => {
                        const isBooked = bookedSlots.includes(slot)
                        const isSelected = selectedSlot === slot

                        return (
                          <button
                            type="button"
                            key={slot}
                            disabled={isBooked}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                              isBooked
                                ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through opacity-60'
                                : isSelected
                                ? 'bg-[#EF3030] text-white border-[#EF3030] shadow-md shadow-red-500/20 ring-2 ring-red-400'
                                : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#EF3030] hover:text-[#EF3030]'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{slot}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="pt-4 border-t border-[#E5E5E5] flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(null)}
                      className="px-5 py-2.5 rounded-xl border border-[#E5E5E5] text-[#111111] text-xs font-semibold hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedSlot || isBooking}
                      onClick={handleBookAppointment}
                      className="px-6 py-2.5 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white text-xs font-bold shadow-md shadow-red-500/20 disabled:opacity-40"
                    >
                      {isBooking ? 'Confirming...' : 'Confirm Appointment'}
                    </button>
                  </div>
                </>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
