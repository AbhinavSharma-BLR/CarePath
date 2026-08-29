import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function getErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  if (err.code === 'ECONNABORTED') {
    return 'Connection timed out while reaching CAREPATH auth service.';
  }

  if (err.message === 'Network Error' || !err.response) {
    return 'Unable to connect to CAREPATH auth service. Please check backend connection.';
  }

  return err.message || 'Unable to send OTP. Please try again.';
}
