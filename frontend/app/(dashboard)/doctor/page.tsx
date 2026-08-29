'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { ReferralCard } from '@/components/referral/ReferralCard';
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button';
import { api } from '@/lib/api';

export default function DoctorDashboard() {
  const queryClient = useQueryClient();
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [targetSpecialty, setTargetSpecialty] = useState('Neurology');
  const [referralReason, setReferralReason] = useState('Follow-up evaluation required for neurological symptoms.');

  const { data: referralsData, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const res = await api.get('/referrals');
      return res.data.referrals;
    },
  });

  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/referrals/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });

  const arriveMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/referrals/${id}/arrive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });

  const consultMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/referrals/${id}/consult`, { notes: 'Cardiology evaluation completed. ECG reviewed.' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });

  const referFurtherMutation = useMutation({
    mutationFn: async ({ id, targetSpecialty, reason }: { id: string; targetSpecialty: string; reason: string }) => {
      return api.post(`/referrals/${id}/refer-further`, { targetSpecialty, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setSelectedReferral(null);
    },
  });

  return (
    <div className="min-h-screen bg-[#050505]">
      <Header title="Doctor Dashboard — Clinician Referrals" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Incoming Referral Queue</h2>
              <p className="text-sm text-zinc-400">Review patient records, approve referrals & initiate linked care.</p>
            </div>
            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold rounded-full">
              Cardiology Unit
            </span>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-44 bg-zinc-900 rounded-xl animate-pulse"></div>
              <div className="h-44 bg-zinc-900 rounded-xl animate-pulse"></div>
            </div>
          ) : referralsData?.length === 0 ? (
            <div className="p-12 text-center bg-[#1F1F1F] rounded-2xl border border-[#3F3F46]">
              <div className="text-4xl mb-3">🩺</div>
              <h3 className="font-semibold text-white text-lg">No Pending Referrals</h3>
              <p className="text-sm text-zinc-400 mt-1">All incoming patient referrals have been attended to.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {referralsData?.map((item: any) => (
                <ReferralCard
                  key={item.id}
                  id={item.id}
                  journeyId={item.journey?.journeyId || 'CP-847291'}
                  patientName="Abhinav Sharma (20, Male)"
                  specialty={item.specialty}
                  reason={item.reason}
                  status={item.status}
                  createdAt={item.createdAt}
                  onAccept={() => updateReferralMutation.mutate({ id: item.id, status: 'ACCEPTED' })}
                  onArrive={() => arriveMutation.mutate(item.id)}
                  onConsult={() => consultMutation.mutate(item.id)}
                  onReferFurther={() => setSelectedReferral(item)}
                />
              ))}
            </div>
          )}

          {/* Modal for Refer Further */}
          {selectedReferral && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-2">Create Linked Referral</h3>
                <p className="text-xs text-zinc-400 mb-4">
                  This referral will be linked under Care Journey ID:{' '}
                  <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">{selectedReferral.journey?.journeyId || 'CP-847291'}</code>
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Target Specialty</label>
                    <input
                      type="text"
                      value={targetSpecialty}
                      onChange={(e) => setTargetSpecialty(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Reason for Cross-Referral</label>
                    <textarea
                      value={referralReason}
                      onChange={(e) => setReferralReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2 items-center">
                    <button
                      onClick={() => setSelectedReferral(null)}
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-xs hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                    <LiquidMetalButton
                      label="Submit Linked Referral"
                      loading={referFurtherMutation.isPending}
                      onClick={() =>
                        referFurtherMutation.mutate({
                          id: selectedReferral.id,
                          targetSpecialty,
                          reason: referralReason,
                        })
                      }
                      className="py-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
