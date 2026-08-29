'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity, ShieldCheck, Users, Stethoscope, BarChart3, Clock, AlertCircle, Calendar, FileText, ChevronDown, Phone, Mail, LogOut } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { CarePathLogo } from '@/components/brand/carepath-logo'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [funnel, setFunnel] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'doctors'>('overview')
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
    } finally {
      document.cookie = 'carepath_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'carepath_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      localStorage.clear()
      router.push('/login')
      router.refresh()
    }
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [metricsRes, funnelRes, patientsRes, doctorsRes] = await Promise.all([
          api.get('/admin/metrics').catch(() => null),
          api.get('/admin/funnel').catch(() => null),
          api.get('/admin/users/patients').catch(() => null),
          api.get('/admin/users/doctors').catch(() => null),
        ])

        if (metricsRes?.data?.success) setMetrics(metricsRes.data.metrics)
        if (funnelRes?.data?.success) setFunnel(funnelRes.data.funnel)
        if (patientsRes?.data?.success) setPatients(patientsRes.data.patients)
        if (doctorsRes?.data?.success) setDoctors(doctorsRes.data.doctors)
          
      } catch (err) {
        setError('Failed to load dashboard data.')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-neutral-950 text-[#111111] dark:text-neutral-50 pb-12">
      
      <header className="bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <CarePathLogo size="md" showTagline={true} />
            <span className="ml-3 font-bold text-sm text-[#EF3030] bg-[#EF3030]/10 px-2 py-0.5 rounded-md hidden sm:inline-block">Admin Portal</span>
          </Link>

          <div className="flex space-x-4">
             <Link href="/admin/doctors" className="text-white hover:text-[#EF3030] text-sm font-semibold transition-colors">
               Verify Doctors
             </Link>
             <button 
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-[#888888] hover:text-white transition-colors text-sm font-semibold disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-white p-1.5 rounded-2xl border border-[#E5E5E5] w-fit shadow-sm">
          {['overview', 'patients', 'doctors'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[#EF3030] text-white shadow-md shadow-red-500/20'
                  : 'text-[#666666] hover:text-[#111111] hover:bg-neutral-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-start space-x-3 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-[#888888] flex flex-col items-center">
            <Activity className="w-8 h-8 animate-spin mb-4 text-[#EF3030]" />
            Loading real-time analytics & users...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E5] space-y-4 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 text-[#EF3030] mb-2">
                      <ShieldCheck className="w-6 h-6" />
                      <h1 className="text-2xl font-bold text-[#111111]">Platform Administration</h1>
                    </div>
                    <p className="text-sm text-[#666666]">
                      Manage doctor approvals, view real-time platform analytics, and monitor patient health journeys.
                    </p>
                  </div>
                  <Link 
                    href="/admin/doctors" 
                    className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white font-semibold text-sm transition-all shadow-sm"
                  >
                    Review Pending Doctors
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl p-6 border border-[#E5E5E5] space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-[#EF3030]" />
                      </div>
                      <span className="text-2xl font-bold text-[#111111]">{metrics?.totalJourneys || 0}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#666666]">Total Journeys</h3>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-[#E5E5E5] space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-2xl font-bold text-[#111111]">{metrics?.activeJourneys || 0}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#666666]">Active Journeys</h3>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-[#E5E5E5] space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-2xl font-bold text-[#111111]">{patients.length || 0}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#666666]">Registered Patients</h3>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-[#E5E5E5] space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-2xl font-bold text-[#111111]">{doctors.length || 0}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#666666]">Verified Doctors</h3>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'patients' && (
              <motion.div
                key="patients"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-bold text-[#111111]">Patient Directory</h2>
                <div className="grid grid-cols-1 gap-4">
                  {patients.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
                      <div 
                        className="p-6 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => setExpandedUserId(expandedUserId === p.id ? null : p.id)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                            {p.user?.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#111111] text-lg">{p.user?.name || 'Unknown Patient'}</h3>
                            <div className="flex items-center text-sm text-[#666666] space-x-4 mt-1">
                              <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> {p.user?.phone}</span>
                              <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1" /> {p.age || '--'} Yrs, {p.gender || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-[#666666]">
                          <div className="text-center">
                            <span className="block font-bold text-[#111111]">{p.consultations?.length || 0}</span>
                            Consults
                          </div>
                          <div className="text-center">
                            <span className="block font-bold text-[#111111]">{p.prescriptions?.length || 0}</span>
                            Rx
                          </div>
                          <div className="text-center">
                            <span className="block font-bold text-[#111111]">{p.reports?.length || 0}</span>
                            Reports
                          </div>
                          <ChevronDown className={`w-5 h-5 transition-transform ${expandedUserId === p.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedUserId === p.id && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-[#E5E5E5] bg-[#FAFAFA]"
                          >
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                              
                              <div className="space-y-4">
                                <h4 className="font-bold text-sm text-[#111111] uppercase tracking-wide">Medical Profile</h4>
                                <div className="bg-white p-4 rounded-xl border border-[#E5E5E5] space-y-3 text-sm">
                                  <div><span className="text-[#666666] mr-2">Blood Group:</span> <span className="font-semibold">{p.bloodGroup || 'Not provided'}</span></div>
                                  <div><span className="text-[#666666] mr-2">Location:</span> <span className="font-semibold">{p.locationText || 'Not provided'}</span></div>
                                  <div><span className="text-[#666666] mr-2">Conditions:</span> <span className="font-semibold text-red-600">{p.knownConditions?.length ? p.knownConditions.join(', ') : 'None'}</span></div>
                                  <div><span className="text-[#666666] mr-2">Allergies:</span> <span className="font-semibold">{p.allergies?.length ? p.allergies.join(', ') : 'None'}</span></div>
                                </div>

                                <h4 className="font-bold text-sm text-[#111111] uppercase tracking-wide pt-2">Recent Reports</h4>
                                <div className="space-y-2">
                                  {p.reports?.length > 0 ? p.reports.map((r: any) => (
                                    <div key={r.id} className="bg-white p-3 rounded-lg border border-[#E5E5E5] flex justify-between items-center text-sm">
                                      <div className="flex items-center font-medium"><FileText className="w-4 h-4 mr-2 text-blue-500" /> {r.reportType}</div>
                                      <span className="text-xs text-[#888888]">{new Date(r.uploadedAt).toLocaleDateString()}</span>
                                    </div>
                                  )) : <p className="text-sm text-[#888888]">No reports uploaded.</p>}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="font-bold text-sm text-[#111111] uppercase tracking-wide">Consultation History</h4>
                                <div className="space-y-3">
                                  {p.consultations?.length > 0 ? p.consultations.map((c: any) => (
                                    <div key={c.id} className="bg-white p-4 rounded-xl border border-[#E5E5E5] text-sm">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-[#111111]">Dr. {c.doctor?.user?.name || 'Unknown'}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                          {c.status}
                                        </span>
                                      </div>
                                      <div className="text-[#666666] flex items-center text-xs">
                                        <Calendar className="w-3.5 h-3.5 mr-1" /> {new Date(c.startedAt).toLocaleString()}
                                      </div>
                                      {c.notes && <p className="mt-2 text-[#555555] italic bg-neutral-50 p-2 rounded-md">"{c.notes}"</p>}
                                    </div>
                                  )) : <p className="text-sm text-[#888888]">No consultation history.</p>}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {patients.length === 0 && <div className="p-8 text-center text-[#888888] bg-white rounded-xl border border-[#E5E5E5]">No patients registered yet.</div>}
                </div>
              </motion.div>
            )}

            {activeTab === 'doctors' && (
              <motion.div
                key="doctors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-bold text-[#111111]">Doctor Directory</h2>
                <div className="grid grid-cols-1 gap-4">
                  {doctors.map((d) => (
                    <div key={d.id} className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
                      <div 
                        className="p-6 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => setExpandedUserId(expandedUserId === d.id ? null : d.id)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                            {d.user?.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#111111] text-lg">{d.user?.name || 'Unknown Doctor'}</h3>
                            <div className="flex items-center text-sm text-[#666666] space-x-4 mt-1">
                              <span className="flex items-center text-[#EF3030] font-medium"><Stethoscope className="w-3.5 h-3.5 mr-1" /> {d.specialty}</span>
                              <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {d.experienceYrs} Yrs Exp</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-[#666666]">
                          <div className="text-center">
                            <span className="block font-bold text-[#111111]">{d.consultations?.length || 0}</span>
                            Consults Given
                          </div>
                          <div className="text-center">
                            <span className="block font-bold text-[#111111]">{d.prescriptions?.length || 0}</span>
                            Rx Issued
                          </div>
                          <div className="text-center">
                            <span className="block font-bold text-[#111111] text-amber-500">★ {d.rating}</span>
                            Rating
                          </div>
                          <ChevronDown className={`w-5 h-5 transition-transform ${expandedUserId === d.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedUserId === d.id && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-[#E5E5E5] bg-[#FAFAFA]"
                          >
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <h4 className="font-bold text-sm text-[#111111] uppercase tracking-wide">Professional Profile</h4>
                                <div className="bg-white p-4 rounded-xl border border-[#E5E5E5] space-y-3 text-sm">
                                  <div><span className="text-[#666666] mr-2">Phone:</span> <span className="font-semibold">{d.user?.phone}</span></div>
                                  <div><span className="text-[#666666] mr-2">Languages:</span> <span className="font-semibold">{d.languages?.join(', ')}</span></div>
                                  <div><span className="text-[#666666] mr-2">Consultation Fee:</span> <span className="font-semibold text-green-600">₹{d.consultationFee}</span></div>
                                  <div><span className="text-[#666666] mr-2">Status:</span> 
                                    <span className={`font-semibold ${d.isVerified ? 'text-green-600' : 'text-amber-500'}`}>
                                      {d.isVerified ? 'Verified' : 'Pending Verification'}
                                    </span>
                                  </div>
                                </div>
                                {d.bio && (
                                  <div className="text-sm text-[#666666] bg-white p-4 rounded-xl border border-[#E5E5E5]">
                                    <span className="block font-bold text-[#111111] mb-1">Bio</span>
                                    {d.bio}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4">
                                <h4 className="font-bold text-sm text-[#111111] uppercase tracking-wide">Recent Consultations</h4>
                                <div className="space-y-3">
                                  {d.consultations?.length > 0 ? d.consultations.slice(0, 5).map((c: any) => (
                                    <div key={c.id} className="bg-white p-4 rounded-xl border border-[#E5E5E5] text-sm">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-[#111111]">Patient: {c.patient?.user?.name || 'Unknown'}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                          {c.status}
                                        </span>
                                      </div>
                                      <div className="text-[#666666] flex items-center text-xs">
                                        <Calendar className="w-3.5 h-3.5 mr-1" /> {new Date(c.startedAt).toLocaleString()}
                                      </div>
                                    </div>
                                  )) : <p className="text-sm text-[#888888]">No consultations recorded.</p>}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {doctors.length === 0 && <div className="p-8 text-center text-[#888888] bg-white rounded-xl border border-[#E5E5E5]">No doctors registered yet.</div>}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

      </main>
    </div>
  )
}
