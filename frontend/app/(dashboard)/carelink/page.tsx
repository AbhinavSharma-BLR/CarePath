'use client';

import { useState } from 'react';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button';

const mockAssistanceRequests = [
  {
    id: 'REQ-101',
    patientName: 'Abhinav Sharma',
    patientAge: 20,
    type: 'HOSPITAL_NAVIGATION',
    location: 'Rajiv Gandhi Govt General Hospital',
    notes: 'Needs help reaching Cardiology OPD, Block B, 2nd Floor.',
    status: 'PENDING',
    createdAt: '10 mins ago',
  },
  {
    id: 'REQ-102',
    patientName: 'Ramesh Patel',
    patientAge: 64,
    type: 'TRANSPORT_INFO',
    location: 'Primary Health Centre Vyasarpadi',
    notes: 'Requires wheelchair assistance from gate to consultation room.',
    status: 'ASSIGNED',
    navigator: 'Anitha Ramesh',
    createdAt: '25 mins ago',
  },
];

export default function CarelinkDashboard() {
  const [requests, setRequests] = useState(mockAssistanceRequests);

  const handleAssign = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'ASSIGNED', navigator: 'Anitha Ramesh' } : r))
    );
  };

  const handleComplete = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'COMPLETED' } : r))
    );
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      <Header title="CARELINK — Navigator Desk" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Patient Practical Assistance</h2>
              <p className="text-sm text-zinc-400">Navigators assist patients with directions, transport & hospital guidance.</p>
            </div>
            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold rounded-full">
              CARELINK Active Desk
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <div key={req.id} className="p-5 rounded-xl bg-[#1F1F1F] border border-[#3F3F46] space-y-3 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {req.type}
                    </span>
                    <h3 className="font-semibold text-white text-base mt-2">
                      {req.patientName} ({req.patientAge}y)
                    </h3>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                      req.status === 'COMPLETED'
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : req.status === 'ASSIGNED'
                        ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="text-xs text-zinc-300 space-y-1">
                  <div>
                    <span className="text-zinc-500">Location:</span> {req.location}
                  </div>
                  <div>
                    <span className="text-zinc-500">Notes:</span> {req.notes}
                  </div>
                  {req.navigator && (
                    <div>
                      <span className="text-zinc-500">Assigned Navigator:</span>{' '}
                      <span className="text-zinc-200 font-medium">{req.navigator}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800 flex gap-2">
                  {req.status === 'PENDING' && (
                    <LiquidMetalButton
                      label="Accept & Assign Self (Anitha)"
                      onClick={() => handleAssign(req.id)}
                      className="py-1.5 text-xs"
                    />
                  )}

                  {req.status === 'ASSIGNED' && (
                    <LiquidMetalButton
                      label="Mark Assistance Completed"
                      onClick={() => handleComplete(req.id)}
                      className="py-1.5 text-xs"
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
