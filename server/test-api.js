#!/usr/bin/env node

/**
 * API Testing Script - Validates all DogeLinx API endpoints
 * Run with: node test-api.js
 */

const http = require('http');
const https = require('https');

const API_URL = 'http://localhost:4000';

const tests = [
  {
    name: "GET /api/games",
    method: "GET",
    path: "/api/games",
    expectedStatus: 200
  },
  {
    name: "GET /api/items",
    method: "GET", 
    path: "/api/items",
    expectedStatus: 200
  },
  {
    name: "GET /api/games/:id (not found)",
    method: "GET",
    path: "/api/games/nonexistent",
    expectedStatus: 404
  },
  {
    name: "POST /api/download-studio",
    method: "POST",
    path: "/api/download-studio",
    expectedStatus: 200,
    expectedHeader: 'application/zip'
  },
  {
    name: "GET /api/games/:gameId/sessions",
    method: "GET",
    path: "/api/games/test-game/sessions",
    expectedStatus: 200
  }
];

async function runTests() {
  console.log("🧪 Testing DogeLinx API Server...\n");
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await makeRequest(test);
      if (result.success) {
        console.log(`✅ ${test.name}`);
        console.log(`   Status: ${result.status}, Content-Type: ${result.contentType}\n`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Expected: ${test.expectedStatus}, Got: ${result.status}`);
        console.log(`   Error: ${result.error}\n`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

function makeRequest(test) {
  return new Promise((resolve) => {
    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const url = new URL(test.path, API_URL);
    const request = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode === test.expectedStatus;
        const contentType = res.headers['content-type'] || '';
        
        if (test.expectedHeader && !contentType.includes(test.expectedHeader)) {
          resolve({
            success: false,
            status: res.statusCode,
            contentType,
            error: `Expected ${test.expectedHeader}, got ${contentType}`
          });
        } else {
          resolve({
            success,
            status: res.statusCode,
            contentType,
            data
          });
        }
      });
    });

    request.on('error', (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });

    request.end();
  });
}

// Run tests
runTests();
