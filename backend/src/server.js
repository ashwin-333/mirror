const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');

// Load env variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase JSON limit for base64 images
app.use(cors());

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

// Health check route - this works even if DB is down
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    dbConnected: app.locals.dbConnected || false,
    timestamp: new Date().toISOString()
  });
});

// Database status middleware
app.use(async (req, res, next) => {
  // Skip middleware for health check
  if (req.path === '/health') {
    return next();
  }
  
  // If DB is already connected, proceed
  if (app.locals.dbConnected) {
    return next();
  }
  
  // If DB connection is not established yet or previously failed
  if (app.locals.dbConnected === false) {
    res.status(503).json({
      message: 'Database connection is not available',
      error: 'Service Unavailable'
    });
    return;
  }
  
  // If we don't know the DB status yet, try connecting
  try {
    const dbConnected = await connectDB();
    app.locals.dbConnected = dbConnected;
    
    if (dbConnected) {
      return next();
    } else {
      res.status(503).json({
        message: 'Database connection is not available',
        error: 'Service Unavailable'
      });
    }
  } catch (error) {
    res.status(503).json({
      message: 'Database connection error',
      error: error.message
    });
  }
});

// Serve static files from the uploads directory
app.use('/uploads', (req, res, next) => {
  // Log the requested file
  console.log('Static file request for:', req.url);
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5002;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Connect to MongoDB and start server
const startServer = async () => {
  console.log('Starting server...');
  
  // Connect to MongoDB
  const dbConnected = await connectDB();
  app.locals.dbConnected = dbConnected;
  
  if (!dbConnected) {
    console.warn('Server starting without database connection. Only health check will be available.');
  }
  
  // Start the server
  app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`Health check available at http://${HOST}:${PORT}/health`);
  });
};

startServer(); 