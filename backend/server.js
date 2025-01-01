const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const guideRoutes = require('./routes/guideRoutes');

const app = express();

// CORS configuration with credentials and a fixed frontend URL
const corsOptions = {
  origin: 'https://veg-bridge-frontend.vercel.app',  // Fixed frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allow credentials (cookies, headers, etc.)
};

// Apply CORS globally with the fixed origin and credentials support
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Connect to MongoDB
connectDB();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Root route (for testing)
app.get('/', (req, res) => {
  res.send('Backend is up and running!');
});

// Routes with the same CORS configuration applied
app.use('/api/products', cors(corsOptions), productRoutes);
app.use('/api/orders', cors(corsOptions), orderRoutes);
app.use('/api/guides', cors(corsOptions), guideRoutes);
app.use('/api', cors(corsOptions), authRoutes);

// Export serverless function for Vercel
module.exports = (req, res) => {
  app(req, res);
};
