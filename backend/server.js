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

// Basic CORS configuration
const corsOptions = {
  origin: '*', // Allow any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // Do not apply credentials globally
};

// Apply CORS globally (without credentials)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Apply CORS with credentials for specific routes
const corsWithCredentials = {
  ...corsOptions,
  credentials: true, // Allow credentials on specific routes
};

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

// Routes with CORS configuration
app.use('/api/products', cors(corsWithCredentials), productRoutes); // Apply credentials here
app.use('/api/orders', cors(corsWithCredentials), orderRoutes); // Apply credentials here
app.use('/api/guides', cors(corsWithCredentials), guideRoutes); // Apply credentials here

// Other routes that don't need credentials
app.use('/api', authRoutes);

// Export serverless function
module.exports = (req, res) => {
  app(req, res);
};
