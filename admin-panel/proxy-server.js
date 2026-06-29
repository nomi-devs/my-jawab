// Standalone CORS Proxy Server
// Run with: npm run proxy
// This server proxies requests to avoid CORS issues
// Install dependencies first: npm install express http-proxy-middleware cors

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins, or specify your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Proxy middleware
app.use('/api', createProxyMiddleware({
  target: 'https://72.60.181.228/Jawab',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    // Remove x-xsrf-token header if present
    proxyReq.removeHeader('x-xsrf-token');
    console.log(`[PROXY] ${req.method} ${req.url} → https://72.60.181.228/Jawab${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept';
    console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY] Error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying /api/* → https://72.60.181.228/Jawab/api/*`);
  console.log(`\nTo use this proxy, update axiosClient.js baseURL to: http://localhost:${PORT}/api`);
});
