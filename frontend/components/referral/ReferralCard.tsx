'use client';

import { formatDate } from '@carepath/utils';
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button';

interface ReferralCardProps {
  id: string;
  journeyId: string;
  patientName: string;
  specialty: string;
  reason: string;
  status: string;
  createdAt: string;
  onAccept?: () => void;
  onArrive?: () => void;
  onConsult?: () => void;
  onReferFurther?: () => void;
}

export function ReferralCard({
  id,
  journeyId,
  patientName,
  specialty,
  reason,
  status,
  createdAt,
  onAccept,
  onArrive,
  onConsult,
  onReferFurther,
}: ReferralCardProps) {
  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PENDING':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'ACCEPTED':
        return 'bg-zinc-800 text-zinc-200 border-zinc-700 font-semibold';
      case 'PATIENT_ARRIVED':
        return 'bg-zinc-800 text-zinc-200 border-zinc-700';
      case 'CONSULTATION_COMPLETED':
      case 'COMPLETED':
        return 'bg-zinc-800 text-zinc-200 border-zinc-700';
      case 'FURTHER_REFERRAL':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-800';
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[#1F1F1F] border border-[#3F3F46] hover:border-zinc-500 transition-all duration-200 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-200 border border-zinc-700">
              {journeyId}
            </span>
            <h4 className="font-semibold text-white text-base mt-2">{patientName}</h4>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusBadge(status)}`}>
            {status}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-zinc-300 mb-4">
          <div>
            <span className="text-zinc-400">Requested Specialty:</span>{' '}
            <span className="font-medium text-white">{specialty}</span>
          </div>
          <div>
            <span className="text-zinc-400">Clinical Reason:</span> {reason}
          </div>
          <div className="text-[11px] text-zinc-500">{formatDate(createdAt)}</div>
        </div>
      </div>

      {/* Action panel */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-800">
        {status === 'PENDING' && onAccept && (
          <LiquidMetalButton
            label="Accept Referral"
            onClick={onAccept}
            className="py-1.5 px-3.5 text-xs"
          />
        )}

        {status === 'ACCEPTED' && onArrive && (
          <LiquidMetalButton
            label="Mark Patient Arrived"
            onClick={onArrive}
            className="py-1.5 px-3.5 text-xs"
          />
        )}

        {status === 'PATIENT_ARRIVED' && onConsult && (
          <LiquidMetalButton
            label="Complete Consult"
            onClick={onConsult}
            className="py-1.5 px-3.5 text-xs"
          />
        )}

        {status === 'CONSULTATION_COMPLETED' && onReferFurther && (
          <LiquidMetalButton
            label="Refer Further (Linked)"
            onClick={onReferFurther}
            className="py-1.5 px-3.5 text-xs"
          />
        )}
      </div>
    </div>
  );
}
