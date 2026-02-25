/**
 * Generate a download of the DogeLinx studio
 * (Minimal bundle without all project files)
 */
export async function downloadStudio() {
  try {
    // Fetch zip from server
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const apiUrl = import.meta.env.VITE_API_URL || (isProduction ? 'https://dogelinx-backend.onrender.com' : 'http://localhost:4000');
    const response = await fetch(`${apiUrl}/api/download-studio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Download response error:', errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // Check if response is actually a zip file
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/zip')) {
      throw new Error('Invalid response: expected ZIP file');
    }

    // Download the zip file
    const blob = await response.blob();
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

    console.log(`Downloaded ${(blob.size / 1024 / 1024).toFixed(2)}MB studio zip`);
  } catch (err) {
    console.error('Error downloading studio:', err);
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
