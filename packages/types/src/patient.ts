import { z } from 'zod';

export const RoleSchema = z.enum([
  'PATIENT',
  'DOCTOR',
  'HOSPITAL_STAFF',
  'CARELINK_NAVIGATOR',
  'ADMIN',
]);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  role: RoleSchema,
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});
export type User = z.infer<typeof UserSchema>;

export const PatientProfileSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  age: z.number().min(0).max(150).nullable().optional(),
  gender: z.string().nullable().optional(),
  locationLat: z.number().nullable().optional(),
  locationLng: z.number().nullable().optional(),
  locationText: z.string().nullable().optional(),
  knownConditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  emergencyContact: z.string().nullable().optional(),
  abhaId: z.string().nullable().optional(),
});
export type PatientProfile = z.infer<typeof PatientProfileSchema>;

export const CreatePatientProfileSchema = PatientProfileSchema.omit({
  id: true,
  userId: true,
});
export type CreatePatientProfileInput = z.infer<typeof CreatePatientProfileSchema>;
