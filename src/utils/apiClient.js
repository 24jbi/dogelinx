/**
 * API Client Helper
 * Ensures API calls go to the correct backend URL
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let error;
      
      if (contentType?.includes('application/json')) {
        error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    return response;
  } catch (err) {
    console.error(`API call failed to ${url}:`, err);
    throw err;
  }
}

export const API_URL = API_BASE_URL;
