import { z } from 'zod';

export const ReferralStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'MODIFIED',
  'ESCALATED',
  'REJECTED',
  'APPOINTMENT_CONFIRMED',
  'PATIENT_ARRIVED',
  'CONSULTATION_COMPLETED',
  'FURTHER_REFERRAL',
  'COMPLETED',
]);
export type ReferralStatus = z.infer<typeof ReferralStatusSchema>;

export const AssistanceTypeSchema = z.enum([
  'DIRECTIONS',
  'HOSPITAL_NAVIGATION',
  'TRANSPORT_INFO',
  'APPOINTMENT_ASSISTANCE',
  'LANGUAGE_ASSISTANCE',
  'CARE_NAVIGATOR',
]);
export type AssistanceType = z.infer<typeof AssistanceTypeSchema>;

export const ReferralEventSchema = z.object({
  id: z.string(),
  referralId: z.string(),
  eventType: z.string(),
  actor: z.string(),
  notes: z.string().nullable().optional(),
  timestamp: z.date().or(z.string()),
});
export type ReferralEvent = z.infer<typeof ReferralEventSchema>;

export const ReferralSchema = z.object({
  id: z.string(),
  journeyId: z.string(),
  patientId: z.string(),
  doctorId: z.string().nullable().optional(),
  facilityId: z.string().nullable().optional(),
  specialty: z.string(),
  reason: z.string(),
  status: ReferralStatusSchema,
  referralCode: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  events: z.array(ReferralEventSchema).optional(),
});
export type Referral = z.infer<typeof ReferralSchema>;

export const CreateReferralSchema = z.object({
  specialty: z.string().min(1, 'Specialty is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  facilityId: z.string().optional(),
  journeyId: z.string().optional(),
});
export type CreateReferralInput = z.infer<typeof CreateReferralSchema>;
