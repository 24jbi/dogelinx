// API URL configuration - determines backend API endpoint
export function getApiUrl() {
  // Production: use Environment variable or hardcoded Railway URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // We're in production (Vercel or similar)
    return import.meta.env.VITE_API_URL || 'https://veubc5rb.up.railway.app';
  }
  
  // Development: use localhost or env var
  return import.meta.env.VITE_API_URL || 'http://localhost:4000';
}
