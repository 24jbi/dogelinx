#!/usr/bin/env node
/**
 * DogeLinx Diagnostic Tool
 * Helps identify backend/frontend connection issues
 */

const http = require('http');
const https = require('https');

const API_URL = process.env.VITE_API_URL || 'http://localhost:4000';
const ENDPOINTS = [
  '/api/games',
  '/api/items',
  '/api/auth/signin',
];

function testEndpoint(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.status,
          contentType: res.headers['content-type'],
          isJson: res.headers['content-type']?.includes('application/json'),
          data: data.substring(0, 100),
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({ error: err.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ error: 'Timeout' });
    });
    
    req.end();
  });
}

async function runDiagnostics() {
  console.log('\n🔍 DogeLinx Backend Diagnostics\n');
  console.log(`API URL: ${API_URL}\n`);
  
  for (const endpoint of ENDPOINTS) {
    const url = `${API_URL}${endpoint}`;
    console.log(`Testing ${endpoint}...`);
    
    try {
      const result = await testEndpoint(url);
      
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      } else if (result.isJson) {
        console.log(`  ✅ OK (${result.status}) - Valid JSON response`);
      } else {
        console.log(`  ⚠️  ${result.status} - ${result.contentType}`);
        console.log(`     Response preview: ${result.data.substring(0, 50)}...`);
      }
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`);
    }
    
    console.log('');
  }
  
  console.log('Recommendations:');
  console.log('1. If all tests fail, make sure backend is running: npm run server');
  console.log('2. If deployed, update VITE_API_URL in .env to point to your deployed backend');
  console.log('3. For Vercel deployment, use: vercel env add VITE_API_URL https://your-backend-url.com');
  console.log('');
}

runDiagnostics().catch(console.error);
