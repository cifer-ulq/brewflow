require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

const {
  AUTH_SERVICE_URL,
  INVENTORY_SERVICE_URL,
  ORDERS_SERVICE_URL,
  HR_SERVICE_URL,
  FINANCE_SERVICE_URL,
} = process.env;

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'api-gateway' })
);

const makeProxy = (target, prefix) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    // Express strips the mount prefix from req.url, so we add it back before forwarding
    pathRewrite: (path) => `${prefix}${path}`,
    on: {
      error: (_err, _req, res) =>
        res.status(502).json({ message: 'Service unavailable' }),
    },
  });

// Full path preserved: /api/v1/auth/login → auth-service:3001/api/v1/auth/login
app.use('/api/v1/auth',      makeProxy(AUTH_SERVICE_URL, '/api/v1/auth'));
app.use('/api/v1/inventory', makeProxy(INVENTORY_SERVICE_URL, '/api/v1/inventory'));
app.use('/api/v1/orders',    makeProxy(ORDERS_SERVICE_URL, '/api/v1/orders'));
app.use('/api/v1/hr',        makeProxy(HR_SERVICE_URL, '/api/v1/hr'));
app.use('/api/v1/finance',   makeProxy(FINANCE_SERVICE_URL, '/api/v1/finance'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`api-gateway running on port ${PORT}`));
