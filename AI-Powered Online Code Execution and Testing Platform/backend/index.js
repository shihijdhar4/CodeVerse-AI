require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const seedData = require('./config/seed');

// Import routes
const authRoutes = require('./routes/auth');
const programRoutes = require('./routes/programs');
const challengeRoutes = require('./routes/challenges');
const executionRoutes = require('./routes/executions');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local testing and deployment
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Basic sanity check route
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    localDBMode: process.env.USE_LOCAL_DB === 'true'
  });
});

// Setup api routes
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Page not found error handler
app.use((req, res, next) => {
  res.status(404).json({ message: `API Route not found: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Initialize DB and start server
const startServer = async () => {
  // Connect to DB (falls back to local JSON mode if mongodb is not running)
  await connectDB();
  
  // Seed initial data if required
  await seedData();
  
  app.listen(PORT, () => {
    console.log(`\n==========================================`);
    console.log(`CodeVerse AI Backend is running on port ${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/health`);
    console.log(`==========================================\n`);
  });
};

startServer();
