#!/usr/bin/env node

// Auto-detect what service this is and run it
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Check if we're supposed to run the backend or frontend
const isBackend = process.env.SERVICE_TYPE === 'backend' || 
                  process.env.RENDER_SERVICE_NAME === 'dogelinx-backend' ||
                  !fs.existsSync(path.join(__dirname, 'dist', 'index.html'));

console.log(`🚀 Detected service type: ${isBackend ? 'BACKEND' : 'FRONTEND'}`);

if (isBackend) {
  console.log('Starting API server on port', process.env.PORT || 4000);
  require('./api.js');
} else {
  console.log('Starting frontend preview server on port', process.env.PORT || 3000);
  spawn('npm', ['run', 'preview'], { stdio: 'inherit' });
}
