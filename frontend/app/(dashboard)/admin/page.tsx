'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';

const funnelData = [
  { stage: 'Symptom Uploads', count: 1240 },
  { stage: 'AI Care Navigation', count: 1180 },
  { stage: 'Referral Requested', count: 950 },
  { stage: 'Clinician Approved', count: 880 },
  { stage: 'Hospital Arrived (QR)', count: 810 },
  { stage: 'Consultation Completed', count: 780 },
  { stage: 'Linked Follow-up Done', count: 720 },
];

export default function AdminDashboard() {
  const { data: journeys } = useQuery({
    queryKey: ['admin-journeys'],
    queryFn: async () => {
      const res = await api.get('/patient/journeys');
      return res.data.journeys;
    },
  });

  return (
    <div className="min-h-screen bg-[#050505]">
      <Header title="CarePath+ Admin — Analytics & National Funnel" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">National Continuity & Funnel Metrics</h2>
              <p className="text-sm text-zinc-400">Track care journey progression across India's hub-and-spoke ecosystem.</p>
            </div>
            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold rounded-full">
              SIH MVP Monitor
            </span>
          </div>

          {/* Metric Stat Cards - Dark Grey #1F1F1F */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-xl bg-[#1F1F1F] border border-[#3F3F46] shadow-lg">
              <div className="text-xs font-medium text-zinc-400">Total Care Journeys</div>
              <div className="text-2xl font-bold text-white mt-1">1,240</div>
              <div className="text-[11px] text-zinc-400 mt-1">↑ 14% this month</div>
            </div>

            <div className="p-5 rounded-xl bg-[#1F1F1F] border border-[#3F3F46] shadow-lg">
              <div className="text-xs font-medium text-zinc-400">Active Referrals</div>
              <div className="text-2xl font-bold text-zinc-200 mt-1">170</div>
              <div className="text-[11px] text-zinc-400 mt-1">Pending & in-transit</div>
            </div>

            <div className="p-5 rounded-xl bg-[#1F1F1F] border border-[#3F3F46] shadow-lg">
              <div className="text-xs font-medium text-zinc-400">Journeys Completed</div>
              <div className="text-2xl font-bold text-zinc-200 mt-1">720</div>
              <div className="text-[11px] text-zinc-400 mt-1">58% completion rate</div>
            </div>

            <div className="p-5 rounded-xl bg-[#1F1F1F] border border-[#3F3F46] shadow-lg">
              <div className="text-xs font-medium text-zinc-400">Avg Time to Referral</div>
              <div className="text-2xl font-bold text-zinc-200 mt-1">3.2 mins</div>
              <div className="text-[11px] text-zinc-400 mt-1">From symptom upload</div>
            </div>
          </div>

          {/* Recharts Funnel Chart - Metallic Grey Bars */}
          <div className="p-6 rounded-2xl bg-[#1F1F1F] border border-[#3F3F46] mb-8 shadow-lg">
            <h3 className="font-semibold text-white text-base mb-4">Care Journey Conversion Funnel</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis type="category" dataKey="stage" stroke="#9CA3AF" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F1F1F', borderColor: '#3F3F46', borderRadius: '8px' }}
                    itemStyle={{ color: '#E5E7EB' }}
                  />
                  <Bar dataKey="count" fill="#4B5563" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Journeys Tree Table */}
          <div className="p-6 rounded-2xl bg-[#1F1F1F] border border-[#3F3F46] shadow-lg">
            <h3 className="font-semibold text-white text-base mb-4">Sample Active Journey Tree</h3>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-zinc-200 bg-zinc-800 px-2.5 py-1 rounded border border-zinc-700">
                    CP-847291
                  </span>
                  <div>
                    <div className="font-semibold text-white text-sm">Abhinav Sharma (Age 20, Male)</div>
                    <div className="text-xs text-zinc-400">Chennai, Tamil Nadu • 2 Linked Referrals</div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold rounded-full">
                  CARE JOURNEY COMPLETED ✓
                </span>
              </div>

              {/* Linked Referrals Chain */}
              <div className="pl-4 border-l-2 border-zinc-800 space-y-3">
                <div className="p-3 bg-[#1F1F1F] rounded-lg border border-zinc-700 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-white">Referral 1: Cardiology OPD</span>
                    <div className="text-zinc-400">Rajiv Gandhi Govt Hospital • QR REF-847291 • Consultation Done</div>
                  </div>
                  <span className="text-zinc-300 font-medium">COMPLETED ✓</span>
                </div>

                <div className="p-3 bg-[#1F1F1F] rounded-lg border border-zinc-700 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-white">Referral 2: Neurology Evaluation (Linked)</span>
                    <div className="text-zinc-400">Government Stanley Medical College • QR REF-902144 • Follow-up Sep 15</div>
                  </div>
                  <span className="text-zinc-300 font-medium">COMPLETED ✓</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
