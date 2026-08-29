import { CareNavigationResult } from '@carepath/types';

export const CARE_NAV_PROMPT = `
You are a care navigation assistant for CAREPATH in India. 
Based on the patient's symptoms and uploaded report summaries, suggest an appropriate medical specialty for evaluation.

STRICT RULES:
1. Never diagnose any illness or condition.
2. Output strictly JSON matching:
{
  "suggestedSpecialty": "Specialty Name (e.g., Cardiology, Endocrinology, Pulmonology, General Medicine)",
  "urgencyLevel": "ROUTINE | SOON | URGENT",
  "reasoning": "One sentence, patient-friendly explanation using phrases like 'evaluation may be appropriate'",
  "disclaimer": "This is a care navigation suggestion only, not a medical diagnosis."
}
3. Use phrases like "evaluation may be appropriate" or "consultation is suggested", NEVER "you have" or "you need treatment for".
4. If symptoms don't clearly match a specific sub-specialty, suggest General Medicine.

Symptoms: {symptoms}
Report summaries: {reportSummaries}
Patient age: {age}, Gender: {gender}
`;

export function buildCareNavPrompt(
  symptoms: string,
  reportSummaries: string,
  age: number = 30,
  gender: string = 'Unknown'
): string {
  return CARE_NAV_PROMPT.replace('{symptoms}', symptoms)
    .replace('{reportSummaries}', reportSummaries || 'None provided')
    .replace('{age}', String(age))
    .replace('{gender}', gender);
}

/**
 * Fallback care navigator for rule-based or mock matching
 */
export function mockCareNavigation(
  symptoms: string,
  reportSummaries: string
): CareNavigationResult {
  const combined = (symptoms + ' ' + reportSummaries).toLowerCase();

  if (
    combined.includes('chest') ||
    combined.includes('heart') ||
    combined.includes('ecg') ||
    combined.includes('st segment') ||
    combined.includes('palpitations')
  ) {
    return {
      suggestedSpecialty: 'Cardiology',
      urgencyLevel: 'SOON',
      reasoning:
        'Cardiology evaluation may be appropriate based on recorded heart-related observations and reported symptoms.',
      disclaimer: 'This is a care navigation suggestion only, not a medical diagnosis.',
    };
  }

  if (
    combined.includes('sugar') ||
    combined.includes('glucose') ||
    combined.includes('hba1c') ||
    combined.includes('diabetes') ||
    combined.includes('thyroid')
  ) {
    return {
      suggestedSpecialty: 'Endocrinology',
      urgencyLevel: 'SOON',
      reasoning:
        'Endocrinology consultation may be helpful to review metabolic blood markers and glycemic levels.',
      disclaimer: 'This is a care navigation suggestion only, not a medical diagnosis.',
    };
  }

  if (
    combined.includes('cough') ||
    combined.includes('breath') ||
    combined.includes('lung') ||
    combined.includes('xray') ||
    combined.includes('wheezing')
  ) {
    return {
      suggestedSpecialty: 'Pulmonology',
      urgencyLevel: 'SOON',
      reasoning:
        'Pulmonology assessment may be beneficial to evaluate respiratory reports and symptoms.',
      disclaimer: 'This is a care navigation suggestion only, not a medical diagnosis.',
    };
  }

  return {
    suggestedSpecialty: 'General Medicine',
    urgencyLevel: 'ROUTINE',
    reasoning:
      'General Medicine evaluation is suggested as a comprehensive first step for initial clinical assessment.',
    disclaimer: 'This is a care navigation suggestion only, not a medical diagnosis.',
  };
}
