const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codeverse';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
    process.env.USE_LOCAL_DB = "false";
    return true;
  } catch (error) {
    console.warn(`\n[WARNING] MongoDB connection failed: ${error.message}`);
    console.warn('--- CodeVerse is falling back to LOCAL JSON FILE DATABASE MODE ---');
    console.warn('Data will be saved into the "backend/data/" directory as JSON files.\n');
    isConnected = false;
    process.env.USE_LOCAL_DB = "true";
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
