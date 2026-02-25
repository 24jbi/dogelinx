// API URL configuration - determines backend API endpoint
export function getApiUrl() {
  // First priority: explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Check if we're in development (localhost)
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  if (isDevelopment) {
    console.log('Development mode - using localhost:4000');
    return 'http://localhost:4000';
  }
  
  // Production: use Render by default (most reliable for WebSockets)
  console.log('Production mode - using Render backend');
  return 'https://dogelinx-backend.onrender.com';
}

// Helper to ensure we always have a valid URL
export const API_BASE_URL = getApiUrl();
