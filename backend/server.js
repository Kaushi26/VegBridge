require('dotenv').config();  
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const connectDB = require('./config/db');  
const authRoutes = require('./routes/auth');  
const productRoutes = require('./routes/productRoutes');  
const orderRoutes = require('./routes/orderRoutes');
const GuideRoutes = require('./routes/guideRoutes');

// Initialize express app
const app = express();

const corsOptions = {
  origin: `${process.env.FRONTEND_URL}`,  // Make sure this matches the frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allow cookies and authorization headers

};

// Use CORS middleware globally
app.use(cors(corsOptions));

// Handle preflight requests (OPTIONS)
app.options('*', cors(corsOptions));  // Ensures OPTIONS requests are handled correctly

// Parse JSON request bodies
app.use(bodyParser.json());

// MongoDB Connection
connectDB();

// Configure Cloudinary with your credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Ensure 'GuideImages' directory exists
const guideImagesDir = path.join(__dirname, 'GuideImages');
if (!fs.existsSync(guideImagesDir)) {
  fs.mkdirSync(guideImagesDir, { recursive: true });
}

// Serve Uploaded Files
app.use('/uploads', express.static(uploadDir));
app.use('/GuideImages', express.static(guideImagesDir));

// Use routes
app.use('/api', authRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/orders', orderRoutes); 
app.use('/api/guides', GuideRoutes);

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed frontend URL: ${process.env.FRONTEND_URL}`);
});
