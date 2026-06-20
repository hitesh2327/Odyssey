import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for reading and setting HttpOnly cookies across origins
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for unified error parsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong';

    if (status === 401) {
      toast.error('Session expired. Please log in again.', { id: 'session-expired' });
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('is_logged_in');
        
        // Prevent redirect loop if already on login or register pages
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    } else if (status === 403) {
      toast.error('Access denied.');
    } else if (status === 404) {
      toast.error('Resource not found.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    } else if (status === 429) {
      toast.error('Too many requests. Please slow down.');
    }

    return Promise.reject(new Error(message));
  }
);
