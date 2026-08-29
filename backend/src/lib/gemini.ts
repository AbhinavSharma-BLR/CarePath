import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function getProModel() {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
}

export function getFlashModel() {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}
