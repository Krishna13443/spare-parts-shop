const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db/mongodb');
const fs = require('fs');
const mongoose = require('mongoose');

// Disable command buffering globally to prevent hangs when DB is disconnected
mongoose.set('bufferCommands', false);

const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const otpRoutes = require('./routes/otp');
const billingRoutes = require('./routes/billing');
const challengeRoutes = require('./routes/challenge');
const widgetRoutes = require('./routes/widgets');
const { authMiddleware, adminMiddleware } = require('./middleware/auth');

const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// --- SHARED API ROUTER ---
const apiRouter = express.Router();
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/otp', otpRoutes);

// Protected Routes (Login required)
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/billing', authMiddleware, billingRoutes);

// Admin-only API Routes
apiRouter.use('/analytics', authMiddleware, adminMiddleware, analyticsRoutes);
apiRouter.use('/challenge', authMiddleware, adminMiddleware, challengeRoutes);
apiRouter.use('/widgets', authMiddleware, adminMiddleware, widgetRoutes);
apiRouter.get('/health', (req, res) => res.json({ status: 'ok' }));

// --- BASE APPLICATION ---
const app = express();
app.set('trust proxy', 1); // Trust first-degree proxy for correct IP detection
app.use(cors());
app.use(express.json());

// Mount APIs
app.use('/api', apiRouter);

// Global Error Handler for logging stack traces
app.use((err, req, res, next) => {
  console.error('SERVER ERROR AT:', req.method, req.url);
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Mount Admin Interface at /admin
app.use('/admin', express.static(path.join(__dirname, 'public-admin')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, 'public-admin', 'index.html')));

// Mount Client Interface at /
app.use(express.static(path.join(__dirname, 'public-client')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public-client', 'index.html')));

async function start() {
  try {
    await connectDB();
    console.log('✓ MongoDB Connection Established');
  } catch (err) { 
    console.error('⚠️ MongoDB Connection Failed:', err.message); 
    console.warn('Operating in LIMITED MODE (Database-driven features may fail). OTP system is READY.');
  }

  app.listen(PORT, () => {
    console.log(`🧑‍🔧 Client Website running on http://localhost:${PORT}`);
    console.log(`🎛️  Admin Dashboard running on http://localhost:${PORT}/admin`);
  });
}

start();
