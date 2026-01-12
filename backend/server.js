const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/game');
const leaderboardRoutes = require('./routes/leaderboard');
const configRoutes = require('./routes/config');
const adConfigRoutes = require('./routes/adconfig');
const adUnitRoutes = require('./routes/adunit');
const abilityRoutes = require('./routes/ability');
const shopRoutes = require('./routes/shop');
const rewardsRoutes = require('./routes/rewards');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📍 Database: ${process.env.MONGODB_URI}`);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Bubble Shooter API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/config', configRoutes);
app.use('/api/adconfig', adConfigRoutes);
app.use('/api/adunit', adUnitRoutes);
app.use('/api/ability', abilityRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/rewards', rewardsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log('🚀 Bubble Shooter Backend Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log('📋 Available endpoints:');
  console.log('   GET  /api/health - Health check');
  console.log('   POST /api/auth/register - User registration');
  console.log('   POST /api/auth/login - User login');
  console.log('   POST /api/auth/google-login - Google login');
  console.log('   GET  /api/user/profile - Get user profile');
  console.log('   GET  /api/user/game-data - Get user game data');
  console.log('   GET  /api/leaderboard - Get leaderboard');
  console.log('   POST /api/game/session - Submit game session');
  console.log('   GET  /api/config/abilities - Get abilities config');
  console.log('   GET  /api/config/ads - Get ads config');
  console.log('   GET  /api/config/game - Get complete game config');
  console.log('   🆕 Ability Management:');
  console.log('   GET  /api/ability - Get all abilities');
  console.log('   POST /api/ability/initialize - Initialize default abilities');
  console.log('   🆕 AdConfig Management:');
  console.log('   GET  /api/adconfig - Get all ad configurations');
  console.log('   POST /api/adconfig/initialize - Initialize default ad configs');
  console.log('   🆕 AdUnit Management:');
  console.log('   GET  /api/adunit - Get all ad units');
  console.log('   GET  /api/adunit/best/:platform/:type - Get best ad unit');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;