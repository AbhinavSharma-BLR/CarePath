'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Activity, 
  User, 
  Stethoscope, 
  Award, 
  FileText, 
  Clock, 
  IndianRupee, 
  Building, 
  Globe, 
  Phone, 
  Camera, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Video
} from 'lucide-react'

// Client-side HTML Canvas image compression helper
function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

export default function DoctorProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Profile Form State
  const [title, setTitle] = useState('Dr.')
  const [name, setName] = useState('Dr. Ananya Sharma')
  const [specialty, setSpecialty] = useState('Dermatology')
  const [qualification, setQualification] = useState('MBBS, MD (Dermatology)')
  const [registrationNo, setRegistrationNo] = useState('MCI-884920')
  const [experienceYrs, setExperienceYrs] = useState<number>(12)
  const [languagesInput, setLanguagesInput] = useState('English, Hindi')
  const [consultationFee, setConsultationFee] = useState<number>(750)
  const [bio, setBio] = useState('Senior Dermatologist specializing in clinical dermatology, skin health, acne treatment, and aesthetic medicine.')
  const [facilityName, setFacilityName] = useState('CarePath+ Central Clinic')
  const [consultationMode, setConsultationMode] = useState('BOTH')
  const [consultationDuration, setConsultationDuration] = useState<number>(30)
  const [phone, setPhone] = useState('9876543211')
  const [avatarUrl, setAvatarUrl] = useState<string>('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300')

  // Load existing profile from backend API
  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('accessToken') || ''
        const res = await fetch('/api/doctor/profile', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
        })
        const data = await res.json()
        if (data.success && data.profile) {
          const p = data.profile
          if (p.title) setTitle(p.title)
          if (p.name) setName(p.name)
          if (p.specialty) setSpecialty(p.specialty)
          if (p.qualification) setQualification(p.qualification)
          if (p.registrationNo) setRegistrationNo(p.registrationNo)
          if (p.experienceYrs !== undefined) setExperienceYrs(p.experienceYrs)
          if (Array.isArray(p.languages)) setLanguagesInput(p.languages.join(', '))
          if (p.consultationFee !== undefined) setConsultationFee(p.consultationFee)
          if (p.bio) setBio(p.bio)
          if (p.facilityName) setFacilityName(p.facilityName)
          if (p.consultationMode) setConsultationMode(p.consultationMode)
          if (p.consultationDuration !== undefined) setConsultationDuration(p.consultationDuration)
          if (p.phone) setPhone(p.phone)
          if (p.avatarUrl) setAvatarUrl(p.avatarUrl)
        }
      } catch (err) {
        console.error('Failed to load profile', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  // Avatar Upload Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressedDataUrl = await compressImage(file)
      setAvatarUrl(compressedDataUrl)
    } catch (err) {
      console.error('Failed to compress avatar image', err)
    }
  }

  // Submit Profile Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Full name is required.')
      setIsSaving(false)
      return
    }

    const languages = languagesInput
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean)

    try {
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          name,
          specialty,
          qualification,
          registrationNo,
          experienceYrs: Number(experienceYrs),
          languages,
          consultationFee: Number(consultationFee),
          bio,
          facilityName,
          consultationMode,
          consultationDuration: Number(consultationDuration),
          avatarUrl,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 4000)
      } else {
        setErrorMessage(data.message || 'Failed to save profile. Please try again.')
      }
    } catch (err: any) {
      setErrorMessage('Network error while saving profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-neutral-950 text-[#111111] dark:text-neutral-50 pb-12">
      
      {/* Header Bar */}
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/doctor/dashboard" className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back to Workspace</span>
          </Link>
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <Stethoscope className="w-5 h-5 text-[#EF3030]" />
            <span>Doctor Profile Settings</span>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center space-x-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Doctor profile updated successfully! Patients will immediately see your updated details.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center space-x-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E5E5] shadow-xl space-y-8">
          
          {/* Avatar Upload Section */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-[#E5E5E5]">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#EF3030]/20 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-2xl border-4 border-[#EF3030]/20 shadow-md">
                  Dr
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#EF3030] text-white p-2 rounded-full shadow-md hover:bg-[#D92727] transition-all"
                title="Upload Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-bold text-[#111111]">Practitioner Profile Photo</h2>
              <p className="text-xs text-[#666666]">
                Upload a professional clinical headshot for patient trust & verified profile badge.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-[#EF3030] hover:underline pt-1 inline-block"
              >
                Change Photo
              </button>
            </div>
          </div>

          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#EF3030] flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Identity & Registration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Title</label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                >
                  <option value="Dr.">Dr.</option>
                  <option value="Prof. Dr.">Prof. Dr.</option>
                  <option value="Assoc. Prof.">Assoc. Prof.</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#111111] mb-1">Full Practitioner Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ananya Sharma"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Medical Specialty *</label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Dermatology, Cardiology"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Medical Council Reg. No *</label>
                <input
                  type="text"
                  required
                  value={registrationNo}
                  onChange={(e) => setRegistrationNo(e.target.value)}
                  placeholder="e.g. MCI-884920"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Credentials */}
          <div className="space-y-4 pt-4 border-t border-[#E5E5E5]">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#EF3030] flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>Qualifications & Experience</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Degrees & Qualifications</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. MBBS, MD, FRCP"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Years of Clinical Experience</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={experienceYrs}
                  onChange={(e) => setExperienceYrs(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Languages Spoken (comma separated)</label>
                <input
                  type="text"
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  placeholder="e.g. English, Hindi, Tamil"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Consultation Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Practice & Facility */}
          <div className="space-y-4 pt-4 border-t border-[#E5E5E5]">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#EF3030] flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span>Facility & Consultation Modes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#111111] mb-1">Primary Hospital / Clinic Name</label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="e.g. CarePath+ Central Hospital"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Consultation Mode</label>
                <select
                  value={consultationMode}
                  onChange={(e) => setConsultationMode(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
                >
                  <option value="BOTH">Telemedicine & Clinic</option>
                  <option value="VIDEO">Telemedicine HD Call</option>
                  <option value="IN_PERSON">In-Person Clinic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Professional Bio & Clinical Overview</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief professional summary describing your clinical expertise and focus..."
                className="w-full p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm text-[#111111] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#EF3030]"
              />
            </div>
          </div>

          {/* Section 4: Verified Phone */}
          <div className="pt-4 border-t border-[#E5E5E5]">
            <label className="block text-xs font-bold text-[#111111] mb-1">Verified Mobile Number (Read Only)</label>
            <div className="flex items-center px-4 py-3 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] text-sm font-semibold text-[#666666]">
              <Phone className="w-4 h-4 text-emerald-600 mr-2" />
              <span>+91 {phone}</span>
              <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                VERIFIED
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-[#E5E5E5] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/doctor/dashboard')}
              className="px-5 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#111111] font-bold text-sm hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-sm shadow-md shadow-red-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  )
}
