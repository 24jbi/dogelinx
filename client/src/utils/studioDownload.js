/**
 * Generate a download of the DogeLinx studio
 * (Minimal bundle without all project files)
 */
import { get, API_BASE_URL } from './apiClient';

export async function downloadStudio() {
  try {
    console.log('📥 Initiating studio download...');
    console.log('📡 API URL:', API_BASE_URL);
    console.log('🌍 Hostname:', window.location.hostname);
    
    const downloadUrl = `${API_BASE_URL}/api/download-studio`;
    console.log('📍 Request URL:', downloadUrl);
    
    const response = await fetch(downloadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response text (first 500 chars):', errorText.substring(0, 500));
      
      // If it's an HTML response (error page), it's likely a routing issue
      if (errorText.includes('<!doctype') || errorText.includes('<html')) {
        throw new Error(
          `API not found at ${API_BASE_URL}\n\n` +
          `This means:\n` +
          `1. Backend is not deployed to Render\n` +
          `2. Or VITE_API_URL is not set in Vercel\n` +
          `3. Or Vercel wasn't redeployed after setting the env var\n\n` +
          `See DIAGNOSTIC_CHECKLIST.md for step-by-step fix`
        );
      }
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // Check if response is actually a zip file
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/zip')) {
      throw new Error(`Invalid content type: ${contentType} (expected application/zip)`);
    }

    // Download the zip file
    const blob = await response.blob();
    console.log('📦 Downloaded', (blob.size / 1024 / 1024).toFixed(2) + 'MB');
    
    if (blob.size === 0) {
      throw new Error('Downloaded ZIP file is empty');
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DogeLinx-Studio-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('✅ Download complete!');
  } catch (err) {
    console.error('❌ Download error:', err);
    throw err;
  }
}

/**
 * Generate a download of just the game data (for sharing)
 */
export async function downloadGame(projectData, projectName = 'game') {
  try {
    const json = typeof projectData === 'string' ? projectData : JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}-data.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error('Error downloading game:', err);
    throw err;
  }
}
