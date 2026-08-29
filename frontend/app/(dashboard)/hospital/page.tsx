'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button';
import { api } from '@/lib/api';

export default function HospitalDashboard() {
  const queryClient = useQueryClient();
  const [scanCode, setScanCode] = useState('REF-847291');
  const [arrivalInfo, setArrivalInfo] = useState<any | null>(null);

  const { data: referrals } = useQuery({
    queryKey: ['hospital-referrals'],
    queryFn: async () => {
      const res = await api.get('/referrals');
      return res.data.referrals;
    },
  });

  const arriveMutation = useMutation({
    mutationFn: async (code: string) => {
      return api.post(`/referrals/${code}/arrive`);
    },
    onSuccess: (res) => {
      setArrivalInfo(res.data);
      queryClient.invalidateQueries({ queryKey: ['hospital-referrals'] });
    },
  });

  return (
    <div className="min-h-screen bg-[#050505]">
      <Header title="Hospital Reception — Patient Arrivals & QR Scan" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">OPD Reception & Arrival Verification</h2>
              <p className="text-sm text-zinc-400">Scan patient referral QR codes to confirm arrival & direct to OPD.</p>
            </div>
            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold rounded-full">
              Rajiv Gandhi Govt General Hospital
            </span>
          </div>

          {/* QR Scan Input Card - Dark Grey #1F1F1F */}
          <div className="p-6 rounded-2xl bg-[#1F1F1F] border border-[#3F3F46] mb-8 max-w-xl shadow-lg">
            <h3 className="font-semibold text-white text-base mb-2">📷 QR Referral Code Scanner</h3>
            <p className="text-xs text-zinc-400 mb-4">Enter or scan the patient's 8-character referral QR code.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                arriveMutation.mutate(scanCode);
              }}
              className="flex gap-3 items-center"
            >
              <input
                type="text"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value.toUpperCase())}
                placeholder="REF-847291"
                className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <LiquidMetalButton
                label={arriveMutation.isPending ? 'Verifying...' : 'Scan & Verify Arrival'}
                loading={arriveMutation.isPending}
                type="submit"
                className="py-2.5 text-xs"
              />
            </form>

            {arrivalInfo && (
              <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-xs space-y-2">
                <div className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <span>✓</span> Patient Arrival Verified!
                </div>
                <div className="text-zinc-300">
                  <span className="text-zinc-400">Patient:</span> Abhinav Sharma (Age 20)
                </div>
                <div className="text-zinc-300">
                  <span className="text-zinc-400">Assigned OPD Location:</span>{' '}
                  <span className="font-bold text-white">{arrivalInfo.locationDirections || 'Block B, 2nd Floor, Counter 4'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Expected Arrivals Queue */}
          <h3 className="font-bold text-lg text-white mb-4">Today's Expected Referrals</h3>
          <div className="space-y-3">
            {referrals?.map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#1F1F1F] border border-[#3F3F46] flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-zinc-200">
                    {item.referralCode || 'REF-847'}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">Abhinav Sharma</div>
                    <div className="text-xs text-zinc-400">
                      {item.specialty} • Journey: {item.journey?.journeyId || 'CP-847291'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                      item.status === 'PATIENT_ARRIVED'
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {item.status}
                  </span>
                  {item.status !== 'PATIENT_ARRIVED' && (
                    <LiquidMetalButton
                      label="Check-In"
                      loading={arriveMutation.isPending}
                      onClick={() => arriveMutation.mutate(item.id)}
                      className="py-1 px-3 text-xs"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
