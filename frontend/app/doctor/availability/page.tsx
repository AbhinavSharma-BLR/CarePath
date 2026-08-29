'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Activity, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Stethoscope,
  Lock
} from 'lucide-react'

export default function DoctorAvailabilityPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [allSlots, setAllSlots] = useState<string[]>([])
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false)

  // New Slot Form State
  const [newSlotTime, setNewSlotTime] = useState<string>('09:00 AM')
  const [customSlotInput, setCustomSlotInput] = useState<string>('')
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Date selection cards
  const dateOptions = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().split('T')[0]
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    return { iso, label }
  })

  // Load Availability for selected date
  const loadAvailability = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch(`/api/doctor/availability?date=${selectedDate}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      })
      const data = await res.json()
      if (data.success) {
        setAllSlots(data.allSlots || data.slots || [])
        setBookedSlots(data.bookedSlots || [])
        if (data.isOnline !== undefined) setIsOnline(data.isOnline)
      }
    } catch (err) {
      console.error('Failed to load availability slots', err)
      setErrorMessage('Unable to fetch appointment slots. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAvailability()
  }, [selectedDate])

  // Add Slot Handler with Validation
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setErrorMessage(null)

    const targetSlot = customSlotInput.trim() || newSlotTime.trim()

    // 1. Empty Check
    if (!targetSlot) {
      setErrorMessage('Please select or enter a valid slot time (e.g. 10:00 AM).')
      return
    }

    // 2. Duplicate Check
    const isDuplicate = allSlots.some(s => s.toLowerCase() === targetSlot.toLowerCase())
    if (isDuplicate) {
      setErrorMessage(`Slot "${targetSlot}" already exists for ${selectedDate}.`)
      return
    }

    setIsAdding(true)

    try {
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch('/api/doctor/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: targetSlot,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (Array.isArray(data.slots)) {
          setAllSlots(data.slots)
        } else {
          setAllSlots(prev => [...prev, targetSlot])
        }
        setMessage(data.message || `Slot "${targetSlot}" added for ${selectedDate}`)
        setCustomSlotInput('')
        setTimeout(() => setMessage(null), 4000)
      } else {
        setErrorMessage(data.message || 'Unable to create appointment slot. Please try again.')
      }
    } catch (err) {
      console.error('Failed to add slot', err)
      setErrorMessage('Network error while creating appointment slot.')
    } finally {
      setIsAdding(false)
    }
  }

  // Remove Slot Handler
  const handleRemoveSlot = async (slotToRemove: string) => {
    setMessage(null)
    setErrorMessage(null)

    if (bookedSlots.includes(slotToRemove)) {
      setErrorMessage(`Slot "${slotToRemove}" cannot be deleted because a patient has booked it.`)
      return
    }

    try {
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch('/api/doctor/availability', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: slotToRemove,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (Array.isArray(data.slots)) {
          setAllSlots(data.slots)
        } else {
          setAllSlots(prev => prev.filter(s => s !== slotToRemove))
        }
        setMessage(`Slot "${slotToRemove}" removed successfully`)
        setTimeout(() => setMessage(null), 4000)
      } else {
        setErrorMessage(data.message || 'Failed to remove slot.')
      }
    } catch (err) {
      console.error('Failed to remove slot', err)
      setErrorMessage('Network error while removing slot.')
    }
  }

  // Toggle Online/Offline Status (Set Offline / Go Online)
  const handleToggleOnlineStatus = async () => {
    setIsTogglingStatus(true)
    setMessage(null)
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
        setMessage(`Practitioner status set to ${newStatus ? 'ONLINE' : 'OFFLINE'}`)
        setTimeout(() => setMessage(null), 4000)
      } else {
        setErrorMessage(data.message || 'Unable to update status.')
      }
    } catch (err) {
      console.error('Failed to toggle status', err)
      setErrorMessage('Unable to change availability status.')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] pb-12">
      
      {/* Header Bar */}
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/doctor/dashboard" className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back to Workspace</span>
          </Link>
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <Calendar className="w-5 h-5 text-[#EF3030]" />
            <span>Appointment Slots & Availability</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {/* Success Toast */}
        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center space-x-3 shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center space-x-3 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-[#EF3030] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Online / Offline Status Card */}
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
              isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-900 text-neutral-400 border border-neutral-700'
            }`}>
              {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Practitioner Telemedicine Status</h2>
              <p className="text-xs text-[#999999]">
                {isOnline ? '● You are available for appointments' : '⚪ You are currently offline'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleOnlineStatus}
            disabled={isTogglingStatus}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 ${
              isOnline
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
            }`}
          >
            {isTogglingStatus ? 'Updating...' : isOnline ? 'Set Offline' : 'Go Online'}
          </button>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-sm space-y-4">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#EF3030]">
            Select Date
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {dateOptions.map((opt) => (
              <button
                key={opt.iso}
                type="button"
                onClick={() => setSelectedDate(opt.iso)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  selectedDate === opt.iso
                    ? 'bg-[#111111] text-white border-[#111111] font-bold shadow-md'
                    : 'bg-[#FAFAFA] text-[#111111] border-[#E5E5E5] hover:bg-neutral-100 font-semibold'
                }`}
              >
                <span className="text-xs opacity-80">{opt.label}</span>
                <span className="text-[11px] font-mono opacity-60">{opt.iso.slice(5)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add New Slot Form */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-sm space-y-4">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#EF3030]">
            + Add Appointment Slot for {selectedDate}
          </label>

          <form onSubmit={handleAddSlot} className="flex flex-col sm:flex-row items-center gap-3">
            
            {/* Quick Preset Selector */}
            <select
              value={newSlotTime}
              onChange={(e) => { setNewSlotTime(e.target.value); setCustomSlotInput('') }}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-bold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
            >
              <option value="08:30 AM">08:30 AM</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="09:30 AM">09:30 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="10:30 AM">10:30 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="11:30 AM">11:30 AM</option>
              <option value="01:30 PM">01:30 PM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="02:30 PM">02:30 PM</option>
              <option value="03:00 PM">03:00 PM</option>
              <option value="03:30 PM">03:30 PM</option>
              <option value="04:00 PM">04:00 PM</option>
              <option value="04:30 PM">04:30 PM</option>
              <option value="05:00 PM">05:00 PM</option>
              <option value="05:30 PM">05:30 PM</option>
              <option value="06:00 PM">06:00 PM</option>
            </select>

            {/* Custom Slot Text Input */}
            <input
              type="text"
              value={customSlotInput}
              onChange={(e) => setCustomSlotInput(e.target.value)}
              placeholder="Or custom time (e.g. 07:15 PM)"
              className="w-full sm:w-64 px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
            />

            <button
              type="submit"
              disabled={isAdding}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-sm shadow-md shadow-red-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'Adding Slot...' : 'Add Slot'}</span>
            </button>
          </form>
        </div>

        {/* Appointment Slots UI Section */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
            <div>
              <h3 className="font-bold text-base text-[#111111]">Appointment Slots</h3>
              <p className="text-xs text-[#666666]">Active consultation slots for {selectedDate}</p>
            </div>
            <span className="text-xs font-bold text-[#111111] bg-[#FAFAFA] px-3 py-1.5 rounded-xl border border-[#E5E5E5]">
              {allSlots.length} Total Slots
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-[#888888]">Loading slots...</div>
          ) : allSlots.length === 0 ? (
            <div className="p-12 text-center space-y-3 border border-dashed border-[#E5E5E5] rounded-2xl">
              <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-sm font-bold text-[#111111]">No appointment slots created yet.</p>
              <p className="text-xs text-[#888888]">Click "Add Slot" above to create your first availability slot for this date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot)

                return (
                  <div
                    key={slot}
                    className={`p-4 rounded-2xl border flex items-center justify-between space-x-3 transition-all ${
                      isBooked
                        ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                        : 'bg-[#FAFAFA] border-[#E5E5E5] hover:border-[#EF3030] text-[#111111]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Clock className={`w-4 h-4 ${isBooked ? 'text-blue-600' : 'text-[#EF3030]'}`} />
                      <div>
                        <span className="text-sm font-extrabold">{slot}</span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isBooked ? 'bg-blue-200 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isBooked ? 'Booked' : 'Available'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isBooked ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="p-1.5 text-blue-400" title="Slot is booked by patient">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
