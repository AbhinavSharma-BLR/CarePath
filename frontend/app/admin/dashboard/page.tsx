'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, ShieldCheck, Users, Stethoscope, BarChart3, Clock, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [funnel, setFunnel] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [metricsRes, funnelRes] = await Promise.all([
          api.get('/admin/metrics').catch(() => null),
          api.get('/admin/funnel').catch(() => null),
        ])

        if (metricsRes?.data?.success) {
          setMetrics(metricsRes.data.metrics)
        }
        if (funnelRes?.data?.success) {
          setFunnel(funnelRes.data.funnel)
        }
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
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-[#EF3030] flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white">CarePath+ Admin Portal</span>
          </Link>

          <div className="flex space-x-4">
             <Link href="/admin/doctors" className="text-white hover:text-[#EF3030] text-sm font-semibold transition-colors">
               Verify Doctors
             </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E5] space-y-4 shadow-sm flex items-center justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 text-[#EF3030] mb-2">
              <ShieldCheck className="w-6 h-6" />
              <h1 className="text-2xl font-bold text-[#111111]">Platform Administration</h1>
            </div>
            <p className="text-sm text-[#666666]">
              Manage doctor approvals, specialty catalogs, platform users, and view real-time platform analytics.
            </p>
          </div>
          <Link 
            href="/admin/doctors" 
            className="px-5 py-2.5 rounded-xl bg-[#EF3030] hover:bg-[#D92727] text-white font-semibold text-sm transition-all shadow-sm shadow-red-500/20"
          >
            Review Pending Doctors
          </Link>
        </motion.div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-start space-x-3 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-[#888888] flex flex-col items-center">
            <Activity className="w-8 h-8 animate-spin mb-4 text-[#EF3030]" />
            Loading real-time analytics...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 border border-[#E5E5E5] space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-[#EF3030]" />
                  </div>
                  <span className="text-2xl font-bold text-[#111111]">{metrics?.totalJourneys || 0}</span>
                </div>
                <h3 className="font-semibold text-sm text-[#666666]">Total Journeys</h3>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-6 border border-[#E5E5E5] space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-[#111111]">{metrics?.activeJourneys || 0}</span>
                </div>
                <h3 className="font-semibold text-sm text-[#666666]">Active Journeys</h3>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 border border-[#E5E5E5] space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold text-[#111111]">{metrics?.completedJourneys || 0}</span>
                </div>
                <h3 className="font-semibold text-sm text-[#666666]">Completed Journeys</h3>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-6 border border-[#E5E5E5] space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-[#111111]">{metrics?.avgCompletionDays || 0}d</span>
                </div>
                <h3 className="font-semibold text-sm text-[#666666]">Avg. Completion Time</h3>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 border border-[#E5E5E5] shadow-sm"
              >
                <h3 className="font-bold text-[#111111] mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Patient Journey Funnel
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                      <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                      <Tooltip cursor={{ fill: '#F7F7F7' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill="#EF3030" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 border border-[#E5E5E5] shadow-sm"
              >
                <h3 className="font-bold text-[#111111] mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Active Consultations Trend
                </h3>
                <div className="h-72 w-full flex items-center justify-center bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E5E5]">
                  {/* Using mock data for the area chart since no endpoint exists yet */}
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { time: '10 AM', count: 12 }, { time: '11 AM', count: 18 },
                      { time: '12 PM', count: 15 }, { time: '1 PM', count: 25 },
                      { time: '2 PM', count: 32 }, { time: '3 PM', count: 28 },
                      { time: '4 PM', count: 22 }
                    ]} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666666' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="count" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
