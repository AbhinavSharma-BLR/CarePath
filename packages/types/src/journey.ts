import { z } from 'zod';
import { ReferralSchema } from './referral';

export const JourneyStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'ABANDONED']);
export type JourneyStatus = z.infer<typeof JourneyStatusSchema>;

export const CareJourneySchema = z.object({
  id: z.string(),
  journeyId: z.string(), // CP-XXXXXX
  patientId: z.string(),
  status: JourneyStatusSchema,
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  referrals: z.array(ReferralSchema).optional(),
});
export type CareJourney = z.infer<typeof CareJourneySchema>;
