const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    console.log('Connecting to MongoDB URI:', process.env.MONGODB_URI.split('@')[1]); // Log without credentials
    
    // Set connection options for better reliability
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Test connection with a simple query
    await mongoose.connection.db.admin().ping();
    console.log('MongoDB Connection verified with ping');
    
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error:`);
    console.error(`Error Name: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.error('Failed to select a MongoDB server. Check your connection string and network connectivity.');
    }
    
    // Don't exit the process, return false instead to allow graceful handling
    return false;
  }
};

module.exports = connectDB; 