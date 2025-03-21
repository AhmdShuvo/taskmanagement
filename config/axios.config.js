import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_SITE_URL + "/api"; // Change this if using a different backend API

export const api = axios.create({
  baseURL,
});

// Add request interceptor to include auth token in all requests
api.interceptors.request.use((config) => {
  // Check if running in browser environment (not during SSR)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('Authentication error: ', error.response.data);
      
      // If running in browser, you could redirect to login or refresh token
      if (typeof window !== 'undefined') {
        // Option: Redirect to login
        // window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);
