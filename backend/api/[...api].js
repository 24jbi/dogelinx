/**
 * Vercel API Proxy Route
 * Routes all /api/* requests to the backend server
 * Set VITE_API_URL environment variable to your backend URL
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Backend server URL - set via Vercel environment variable
const BACKEND_URL = process.env.VITE_API_URL;

module.exports = async (req, res) => {
  // Check if backend URL is configured
  if (!BACKEND_URL) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({ 
      ok: false, 
      error: 'Backend server not configured',
      message: 'VITE_API_URL environment variable is not set on Vercel. Please:',
      steps: [
        '1. Deploy backend to production (Render, Railway, Heroku, etc.)',
        '2. Run: vercel env add production VITE_API_URL https://your-backend-url.com',
        '3. Redeploy: vercel deploy --prod'
      ],
      docs: 'See https://github.com/your-repo for deployment instructions'
    }));
    res.end();
    return;
  }

  try {
    // Extract the API path
    const apiPath = req.url.replace(/^\/api/, '');
    const targetUrl = `${BACKEND_URL}/api${apiPath}`;

    // Parse the backend URL
    const backendUrlObj = new URL(targetUrl);
    const protocol = backendUrlObj.protocol === 'https:' ? https : http;

    // Set up proxy request options
    const proxyOptions = {
      hostname: backendUrlObj.hostname,
      port: backendUrlObj.port || (backendUrlObj.protocol === 'https:' ? 443 : 80),
      path: backendUrlObj.pathname + (backendUrlObj.search || ''),
      method: req.method,
      headers: {
        ...req.headers,
        host: backendUrlObj.host,
        'x-forwarded-for': req.headers['x-forwarded-for'] ? `${req.headers['x-forwarded-for']}, ${req.connection.remoteAddress}` : req.connection.remoteAddress,
        'x-forwarded-proto': 'https',
        'x-forwarded-host': req.headers.host,
      }
    };

    // Remove hop-by-hop headers
    delete proxyOptions.headers['connection'];
    delete proxyOptions.headers['content-length'];

    return new Promise((resolve) => {
      // Forward the request to the backend
      const proxyReq = protocol.request(proxyOptions, (proxyRes) => {
        // Set response headers
        res.statusCode = proxyRes.statusCode;
        
        Object.keys(proxyRes.headers).forEach((key) => {
          // Skip hop-by-hop headers
          if (['transfer-encoding', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
            return;
          }
          res.setHeader(key, proxyRes.headers[key]);
        });

        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Pipe the response
        proxyRes.pipe(res);
        proxyRes.on('end', () => resolve());
      });

      proxyReq.on('error', (error) => {
        console.error('Backend request error:', error);
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({ 
          ok: false, 
          error: 'Backend service unavailable',
          message: error.code === 'ECONNREFUSED' 
            ? 'Could not connect to backend server. Verify VITE_API_URL is correct and backend is running.'
            : error.message,
          backend_url: BACKEND_URL
        }));
        res.end();
        resolve();
      });

      // Handle request timeout
      proxyReq.setTimeout(30000, () => {
        proxyReq.destroy();
        res.statusCode = 504;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({ 
          ok: false, 
          error: 'Backend request timeout' 
        }));
        res.end();
        resolve();
      });

      // For POST/PUT requests, pipe the request body
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message 
    }));
    res.end();
  }
};
