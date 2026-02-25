// Put this in browser console to diagnose API issues
// Copy-paste into browser DevTools console while on your Vercel site

async function diagnoseAPI() {
  console.log('🔍 DogeLinx API Diagnostics Started\n');

  // 1. Check environment
  console.log('1️⃣ Environment:');
  console.log('   Hostname:', window.location.hostname);
  console.log('   URL:', window.location.href);
  console.log('   Admin:', import.meta.env.VITE_API_URL);

  // 2. Import API client and log config
  try {
    const { API_BASE_URL, logAPIConfig } = await import('/src/utils/apiClient.js');
    console.log('   API Base URL:', API_BASE_URL);
    logAPIConfig();
  } catch (e) {
    console.error('   Could not load apiClient.js:', e.message);
  }

  // 3. Test backend connectivity
  console.log('\n2️⃣ Testing Backend Connectivity:');
  const backends = [
    { name: 'Render (default)', url: 'https://dogelinx-backend.onrender.com' },
    { name: 'Localhost', url: 'http://localhost:4000' },
    { name: 'Railway (old)', url: 'https://veubc5rb.up.railway.app' },
  ];

  for (const backend of backends) {
    try {
      const response = await fetch(`${backend.url}/api/games`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      console.log(`   ✅ ${backend.name}: ${response.status} OK - ${JSON.stringify(data).substring(0, 50)}...`);
    } catch (e) {
      console.log(`   ❌ ${backend.name}: ${e.message}`);
    }
  }

  // 4. Test download endpoint
  console.log('\n3️⃣ Testing Download Endpoint:');
  try {
    const { API_BASE_URL } = await import('/src/utils/apiClient.js');
    const response = await fetch(`${API_BASE_URL}/api/download-studio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   Status: ${response.status}`);
    const contentType = response.headers.get('content-type');
    console.log(`   Content-Type: ${contentType}`);
    
    if (response.ok && contentType?.includes('application/zip')) {
      const blob = await response.blob();
      console.log(`   ✅ Got ZIP: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
    } else if (!response.ok) {
      const text = await response.text();
      console.log(`   ❌ Error: ${text.substring(0, 200)}`);
    }
  } catch (e) {
    console.error(`   ❌ ${e.message}`);
  }

  console.log('\n4️⃣ Recommendations:');
  console.log('   • If Render shows ✅: problem is in Vercel config');
  console.log('   • If Render shows ❌: backend is not deployed or has issues');
  console.log('   • Check Vercel env vars: Settings → Environment Variables');
  console.log('   • Check Render dashboard for errors');
}

// Run it
diagnoseAPI();
