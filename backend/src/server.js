const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');

// Load env variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
connectDB();

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

// Serve static files from the uploads directory
app.use('/uploads', (req, res, next) => {
  // Log the requested file
  console.log('Static file request for:', req.url);
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 5002;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
}); 