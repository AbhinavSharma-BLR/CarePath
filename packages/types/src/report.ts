import { z } from 'zod';

export const KeyValueSchema = z.object({
  name: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  isAbnormal: z.boolean().default(false),
  referenceRange: z.string().optional(),
});
export type KeyValue = z.infer<typeof KeyValueSchema>;

export const AISummarySchema = z.object({
  summary: z.string(),
  keyValues: z.array(KeyValueSchema),
  reportDate: z.string().optional(),
  reportType: z.string().optional(),
  disclaimer: z.string(),
});
export type AISummary = z.infer<typeof AISummarySchema>;

export const ReportSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  fileUrl: z.string(),
  reportType: z.string(),
  uploadedAt: z.date().or(z.string()),
  extractedSummary: z.string().nullable().optional(),
  extractedData: AISummarySchema.nullable().optional(),
  isProcessed: z.boolean(),
});
export type Report = z.infer<typeof ReportSchema>;

export const CareNavigationResultSchema = z.object({
  suggestedSpecialty: z.string(),
  urgencyLevel: z.enum(['ROUTINE', 'SOON', 'URGENT']),
  reasoning: z.string(),
  disclaimer: z.string(),
});
export type CareNavigationResult = z.infer<typeof CareNavigationResultSchema>;

export const SafetyCheckResultSchema = z.object({
  isEmergency: z.boolean(),
  reason: z.string(),
  matchedKeywords: z.array(z.string()).optional(),
  actionPrompt: z.string().optional(),
});
export type SafetyCheckResult = z.infer<typeof SafetyCheckResultSchema>;
