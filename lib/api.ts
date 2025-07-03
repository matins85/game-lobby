import axios, { AxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/user/";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export async function apiFetch<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api(path, config);
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data) {
      throw err;
    }
    throw new Error(err.message || 'API error');
  }
} 