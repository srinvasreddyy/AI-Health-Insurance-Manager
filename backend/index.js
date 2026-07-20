require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const predictionRoutes = require('./routes/prediction');

const app = express();

// Security middleware
app.use(helmet());

// CORS Configuration - Allow proper credential handling
app.use(cors({ 
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://ai-health-insurance-manager-g1dl.vercel.app',
    'https://ai-health-insurance-manager.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined'));

// Rate Limiting - Differentiated limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP per 15 minutes
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true // Don't count successful requests
});

// OTP rate limiting - prevent spam
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2, // 2 OTP requests per minute
  message: 'Too many OTP requests. Please wait before requesting another.',
  skipSuccessfulRequests: false
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/google', authLimiter);

// Database Connection with retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/insurance_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
    });
    console.log('MongoDB Connected:', conn.connection.host);
    return true;
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    return false;
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prediction', predictionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler - Improved
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation error', details: err.message });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ message: 'This email is already registered' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // CORS error
  if (err.name === 'CorsError') {
    return res.status(403).json({ message: 'CORS policy violation' });
  }

  // Default error
  res.status(err.status || 500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message 
  });
});

// Initialize server
const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  
  // Connect to database
  const dbConnected = await connectDB();
  
  if (!dbConnected && process.env.NODE_ENV === 'production') {
    console.error('Cannot start server without database connection');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
    console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Using default (CHANGE IN PRODUCTION)'}`);
  });
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

startServer();

module.exports = app;
