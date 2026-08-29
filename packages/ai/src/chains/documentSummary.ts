import { AISummary, AISummarySchema } from '@carepath/types';

export const SUMMARY_PROMPT = `
You are a medical document assistant for CAREPATH, a patient navigation platform in India.
Your job is to extract and summarize medical information from reports in simple, 
clear language that a patient with limited medical literacy can understand.

STRICT RULES:
1. Never diagnose any condition.
2. Never prescribe any treatment.
3. Never say "You have [disease]" — always say "The report shows..." or "Values indicate..."
4. Always include: "This is an automatically generated summary and is not a medical diagnosis."
5. Extract: test names, values, dates, doctor name, facility name, reference ranges.
6. Flag any values outside reference ranges with "⚠️ outside normal range" in the summary and set isAbnormal: true in keyValues.
7. If you cannot extract useful information, say so clearly.

Report content:
{reportText}

Output strictly valid JSON matching this schema:
{
  "summary": "Patient-friendly plain language summary",
  "keyValues": [
    { 
      "name": "Test name", 
      "value": "Measured value", 
      "unit": "Unit if present", 
      "isAbnormal": true/false,
      "referenceRange": "Normal reference range if present" 
    }
  ],
  "reportDate": "YYYY-MM-DD or empty string",
  "reportType": "ECG | BLOOD_REPORT | XRAY | PRESCRIPTION | OTHER",
  "disclaimer": "This is an automatically generated summary and is not a medical diagnosis."
}
`;

export function buildSummaryPrompt(reportText: string): string {
  return SUMMARY_PROMPT.replace('{reportText}', reportText);
}

/**
 * Mock summary generator for fallback when API key is omitted or for testing
 */
export function generateMockSummary(reportType: string, filename: string): AISummary {
  if (reportType.toUpperCase() === 'ECG') {
    return {
      summary:
        'The report shows Sinus Rhythm with a Heart Rate of 78 bpm. ST segment values indicate mild elevation in Lead II. ⚠️ outside normal range for Lead II ST segment.',
      keyValues: [
        { name: 'Heart Rate', value: '78', unit: 'bpm', isAbnormal: false, referenceRange: '60-100' },
        { name: 'PR Interval', value: '160', unit: 'ms', isAbnormal: false, referenceRange: '120-200' },
        { name: 'QRS Duration', value: '88', unit: 'ms', isAbnormal: false, referenceRange: '< 120' },
        { name: 'ST Segment Lead II', value: '+1.5', unit: 'mm', isAbnormal: true, referenceRange: '-0.5 to +1.0' },
      ],
      reportDate: new Date().toISOString().split('T')[0],
      reportType: 'ECG',
      disclaimer: 'This is an automatically generated summary and is not a medical diagnosis.',
    };
  }

  if (reportType.toUpperCase() === 'BLOOD_REPORT') {
    return {
      summary:
        'The report shows Hemoglobin level of 13.8 g/dL and Fasting Blood Sugar of 142 mg/dL. Values indicate Fasting Blood Sugar is ⚠️ outside normal range.',
      keyValues: [
        { name: 'Hemoglobin', value: '13.8', unit: 'g/dL', isAbnormal: false, referenceRange: '13.0-17.0' },
        { name: 'Fasting Blood Sugar', value: '142', unit: 'mg/dL', isAbnormal: true, referenceRange: '70-99' },
        { name: 'HbA1c', value: '6.8', unit: '%', isAbnormal: true, referenceRange: '< 5.7' },
        { name: 'Total Cholesterol', value: '185', unit: 'mg/dL', isAbnormal: false, referenceRange: '< 200' },
      ],
      reportDate: new Date().toISOString().split('T')[0],
      reportType: 'BLOOD_REPORT',
      disclaimer: 'This is an automatically generated summary and is not a medical diagnosis.',
    };
  }

  return {
    summary: `The uploaded document (${filename}) was scanned. General clinical values recorded. No critical immediate abnormalities flagged.`,
    keyValues: [
      { name: 'Document Status', value: 'Scanned', unit: '', isAbnormal: false },
    ],
    reportDate: new Date().toISOString().split('T')[0],
    reportType: reportType.toUpperCase(),
    disclaimer: 'This is an automatically generated summary and is not a medical diagnosis.',
  };
}
