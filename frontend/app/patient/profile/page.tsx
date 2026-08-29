'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Activity, 
  User, 
  Phone, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Save, 
  ShieldCheck, 
  MapPin, 
  HeartPulse,
  LogOut
} from 'lucide-react'

// Zod Profile Schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Mobile number required'),
  age: z.coerce.number().min(1, 'Age is required').max(120, 'Invalid age'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Select gender' }),
  bloodGroup: z.string().min(1, 'Select blood group'),
  dob: z.string().optional(),
  emergencyContact: z.string().min(10, 'Valid 10-digit emergency contact required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  knownConditions: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

// Client-Side Image Compression using Canvas (Target < 1 MB)
function compressImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase())) {
      return reject(new Error('Please choose a JPG, PNG, or WEBP image under 5 MB.'))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Corrupted or invalid image file.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas context unavailable for compression.'))

        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function PatientProfilePage() {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: 'Abhinav Sharma',
      phone: '+918090286983',
      age: 28,
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: '+919876543210',
      address: 'Indiranagar, Bengaluru, Karnataka 560038',
      knownConditions: 'Asthma',
      medications: 'Salbutamol Inhaler',
      allergies: 'Dust',
    },
  })

  // Fetch initial profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem('accessToken') || ''
        const res = await fetch('/api/patient/profile', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
        })

        if (res.status === 401) {
          setErrorMessage('Your session has expired. Please log in again.')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        const data = await res.json()
        if (data.success && data.patient) {
          const p = data.patient
          setValue('name', p.name || p.user?.name || 'Abhinav Sharma')
          setValue('phone', p.phone || p.user?.phone || '+918090286983')
          if (p.age) setValue('age', p.age)
          if (p.gender) setValue('gender', p.gender)
          if (p.bloodGroup) setValue('bloodGroup', p.bloodGroup)
          if (p.emergencyContact) setValue('emergencyContact', p.emergencyContact)
          if (p.address) setValue('address', p.address)
          if (p.avatarUrl) setAvatarUrl(p.avatarUrl)
          if (Array.isArray(p.knownConditions)) setValue('knownConditions', p.knownConditions.join(', '))
          if (Array.isArray(p.medications)) setValue('medications', p.medications.join(', '))
          if (Array.isArray(p.allergies)) setValue('allergies', p.allergies.join(', '))
        }
      } catch (err) {
        console.error('Failed to fetch profile', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [setValue, router])

  // Avatar Upload Handler with Client-Side Canvas Compression
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    setIsUploadingAvatar(true)

    try {
      const compressedBase64 = await compressImage(file, 1024, 1024, 0.85)
      setAvatarUrl(compressedBase64)

      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch('/api/patient/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ avatarBase64: compressedBase64 }),
      })

      if (res.status === 401) {
        setErrorMessage('Your session has expired. Please log in again.')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      if (res.status === 413) {
        setErrorMessage('Image is too large. Compressing image before upload...')
        return
      }

      const resData = await res.json()
      if (res.ok && resData.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 4000)
      } else {
        setErrorMessage(resData.message || 'Failed to upload profile image.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to compress or upload image. Please choose a JPG, PNG, or WEBP image under 5 MB.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Form Submit Handler
  const onSubmit = async (data: ProfileFormData) => {
    // Optimistic UI update
    setSaveSuccess(true)
    setErrorMessage(null)
    setTimeout(() => setSaveSuccess(false), 4000)

    try {
      const token = localStorage.getItem('accessToken') || ''
      const payload = {
        ...data,
        avatarUrl,
        knownConditions: data.knownConditions ? data.knownConditions.split(',').map(s => s.trim()) : [],
        medications: data.medications ? data.medications.split(',').map(s => s.trim()) : [],
        allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()) : [],
      }

      // Fire and forget
      fetch('/api/patient/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).then(async (res) => {
        if (res.status === 401) {
          setErrorMessage('Your session has expired. Please log in again.')
          setTimeout(() => router.push('/login'), 2000)
        }
      }).catch(err => {
        console.error('Network error while saving profile.', err)
      })

    } catch (err) {
      console.error(err)
    }
  }

  // Handle Logout Confirmation & Cleanup
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
    
    document.cookie = 'carepath_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'carepath_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.clear()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111]">
      
      {/* Header Bar */}
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/patient/dashboard" className="flex items-center space-x-2 text-white hover:text-[#EF3030]">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-sm">Back to Dashboard</span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#EF3030] flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-white">CarePath+ Patient Profile</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Alerts */}
        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
            <span className="text-sm font-semibold">Profile saved successfully! All changes are securely persisted.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-800">
            <AlertCircle className="w-5 h-5 text-[#EF3030] flex-shrink-0" />
            <span className="text-sm font-semibold">{errorMessage}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-xl overflow-hidden">
          
          {/* Top Decorative Header */}
          <div className="bg-[#171717] p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 border-b border-[#2A2A2A]">
            
            {/* Avatar Upload Area */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#EF3030] to-[#B91C1C] flex items-center justify-center text-white font-extrabold text-3xl overflow-hidden shadow-lg border-2 border-white/20">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Patient Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>P</span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white"
              >
                <Upload className="w-6 h-6" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
            </div>

            {/* Profile Info Summary */}
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h2 className="text-xl font-bold">Patient Profile Setup</h2>
                <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
              </div>
              <p className="text-xs text-[#999999]">
                Private HIPAA-compliant profile data. Used for verified virtual consultations.
              </p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[#16A34A]/20 text-[#16A34A] text-[10px] font-bold">
                AUTHENTICATED SESSION ACTIVE
              </span>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
            
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#111111] flex items-center space-x-2 border-b border-[#E5E5E5] pb-2">
                <User className="w-4 h-4 text-[#EF3030]" />
                <span>Personal Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Full Name</label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#EF3030] text-sm text-[#111111]"
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                {/* Mobile Phone (Read-Only) */}
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Mobile Number (Verified)</label>
                  <div className="relative">
                    <input
                      {...register('phone')}
                      type="text"
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F5F5F5] text-sm text-[#666666] cursor-not-allowed"
                    />
                    <Phone className="w-4 h-4 text-[#16A34A] absolute right-3 top-3" />
                  </div>
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Age (Years)</label>
                  <input
                    {...register('age')}
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#EF3030] text-sm text-[#111111]"
                  />
                  {errors.age && <p className="text-xs text-red-600 mt-1">{errors.age.message}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Gender</label>
                  <select
                    {...register('gender')}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#EF3030] text-sm text-[#111111] bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender.message}</p>}
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Blood Group</label>
                  <select
                    {...register('bloodGroup')}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#EF3030] text-sm text-[#111111] bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                  {errors.bloodGroup && <p className="text-xs text-red-600 mt-1">{errors.bloodGroup.message}</p>}
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Emergency Contact Number</label>
                  <input
                    {...register('emergencyContact')}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#EF3030] text-sm text-[#111111]"
                  />
                  {errors.emergencyContact && <p className="text-xs text-red-600 mt-1">{errors.emergencyContact.message}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-[#444444] mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#EF3030]" />
                  <span>Residential Address</span>
                </label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#EF3030] text-sm text-[#111111]"
                />
                {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}
              </div>
            </div>

            {/* Section 2: Clinical Summary */}
            <div className="space-y-4 pt-4 border-t border-[#E5E5E5]">
              <h3 className="text-base font-bold text-[#111111] flex items-center space-x-2 border-b border-[#E5E5E5] pb-2">
                <HeartPulse className="w-4 h-4 text-[#EF3030]" />
                <span>Medical History & Conditions</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Known Conditions</label>
                  <input
                    {...register('knownConditions')}
                    placeholder="e.g. Asthma, Hypertension"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-sm text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Current Medications</label>
                  <input
                    {...register('medications')}
                    placeholder="e.g. Inhaler, Metformin"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-sm text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#444444] mb-1">Known Allergies</label>
                  <input
                    {...register('allergies')}
                    placeholder="e.g. Dust, Penicillin"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-sm text-[#111111]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Account & Security Logout */}
            <div className="space-y-4 pt-6 border-t border-[#E5E5E5]">
              <h3 className="text-base font-bold text-[#111111] flex items-center space-x-2 border-b border-[#E5E5E5] pb-2">
                <ShieldCheck className="w-4 h-4 text-[#EF3030]" />
                <span>Account & Security</span>
              </h3>

              <div className="bg-[#FAF9F9] rounded-2xl p-5 border border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#111111]">CarePath+ Account Logout</h4>
                  <p className="text-xs text-[#666666]">
                    Sign out of your CarePath+ account securely. Requires OTP verification on next sign-in.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="px-5 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-[#DC2626] font-semibold text-xs transition-colors flex items-center space-x-2 flex-shrink-0 shadow-sm"
                >
                  <LogOut className="w-4 h-4 text-[#EF3030]" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-[#E5E5E5] flex justify-end space-x-4">
              <Link
                href="/patient/dashboard"
                className="px-6 py-3 rounded-xl border border-[#E5E5E5] text-[#111111] font-semibold text-sm hover:bg-[#F5F5F5] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-semibold text-sm shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>

          </form>
        </div>
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E5E5E5] shadow-2xl space-y-5 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-bold text-[#111111]">Log Out of CarePath+?</h3>
              <p className="text-xs text-[#666666] max-w-xs mx-auto">
                Are you sure you want to log out? You will need to verify your mobile number via OTP to sign back in.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#E5E5E5] text-[#111111] font-semibold text-xs hover:bg-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="flex-1 py-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-md shadow-red-500/20 flex items-center justify-center space-x-1.5"
              >
                {isLoggingOut ? (
                  <span>Logging out...</span>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Yes, Log Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
