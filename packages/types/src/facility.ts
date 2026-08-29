import { z } from 'zod';

export const FacilityTypeSchema = z.enum([
  'PHC',
  'CHC',
  'DISTRICT_HOSPITAL',
  'PRIVATE',
  'TERTIARY',
]);
export type FacilityType = z.infer<typeof FacilityTypeSchema>;

export const FacilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  locationLat: z.number(),
  locationLng: z.number(),
  locationText: z.string(),
  specialties: z.array(z.string()),
  isGovernment: z.boolean(),
  isVerified: z.boolean(),
  hfrId: z.string().nullable().optional(),
  distanceKm: z.number().optional(),
});
export type Facility = z.infer<typeof FacilitySchema>;

export const DoctorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().optional(),
  specialty: z.string(),
  facilityId: z.string().nullable().optional(),
  isVerified: z.boolean(),
  hprId: z.string().nullable().optional(),
});
export type Doctor = z.infer<typeof DoctorSchema>;

export const FacilitySearchParamsSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  specialty: z.string().optional(),
  radiusKm: z.coerce.number().default(25),
  type: FacilityTypeSchema.optional(),
  isGovernment: z.coerce.boolean().optional(),
});
export type FacilitySearchParams = z.infer<typeof FacilitySearchParamsSchema>;
