import { SafetyCheckResult } from '@carepath/types';

export const EMERGENCY_KEYWORDS = [
  'chest pain',
  'chest tightness',
  'difficulty breathing',
  'shortness of breath',
  'unconscious',
  'fainted',
  'seizure',
  'fits',
  'stroke',
  'paralysis',
  'severe bleeding',
  'choking',
  'heart attack',
  'sudden severe headache',
  'cannot speak',
  'slurred speech',
  'overdose',
  'poisoning',
];

/**
 * Fast rule-based safety gate check
 */
export function checkSafetyKeywords(symptoms: string): SafetyCheckResult {
  const normalized = symptoms.toLowerCase();
  const matched = EMERGENCY_KEYWORDS.filter((keyword) => normalized.includes(keyword));

  if (matched.length > 0) {
    return {
      isEmergency: true,
      reason: `Potential emergency indicator detected: "${matched.join(', ')}". Immediate medical evaluation at an emergency department or casualty ward is advised.`,
      matchedKeywords: matched,
      actionPrompt: 'Call emergency services (108 in India) or visit the nearest hospital emergency room immediately.',
    };
  }

  return {
    isEmergency: false,
    reason: 'No immediate red-flag emergency keywords detected.',
    matchedKeywords: [],
  };
}
