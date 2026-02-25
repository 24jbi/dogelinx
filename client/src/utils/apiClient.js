/**
 * Universal API Client
 * Single source of truth for all API calls
 * All components should use this instead of fetch()
 */

// Determine API URL - same logic everywhere
function getAPIBaseUrl() {
  // Priority 1: Explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    console.log('📡 Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // Priority 2: Development/localhost detection
  if (typeof window !== 'undefined') {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDev) {
      console.log('📡 Development mode - using localhost:4000');
      return 'http://localhost:4000';
    }
  }

  // Priority 3: Production default (Render backend)
  console.log('📡 Production mode - using Render backend');
  return 'https://dogelinx-backend.onrender.com';
}

export const API_BASE_URL = getAPIBaseUrl();

export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`[API] ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Handle errors
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } else {
          const text = await response.text();
          // If it's HTML, it means we're getting the wrong response (likely frontend HTML)
          if (text.includes('<!doctype') || text.includes('<html')) {
            errorMsg = `API endpoint not found at ${API_BASE_URL} - backend may not be deployed`;
          } else {
            errorMsg = text;
          }
        }
      } catch (e) {
        // Ignore parse errors, use default error
      }
      
      throw new Error(errorMsg);
    }
    
    return response;
  } catch (err) {
    console.error(`[API ERROR] ${options.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
}

// Convenience methods
export async function get(endpoint) {
  return apiCall(endpoint, { method: 'GET' });
}

export async function post(endpoint, data) {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function put(endpoint, data) {
  return apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Export for logging
export function logAPIConfig() {
  console.log('🔧 API Configuration:');
  console.log('  Base URL:', API_BASE_URL);
  console.log('  VITE_API_URL env:', import.meta.env.VITE_API_URL);
  console.log('  Mode:', import.meta.env.MODE);
  console.log('  Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
}

