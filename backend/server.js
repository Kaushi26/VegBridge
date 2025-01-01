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
const guideRoutes = require('./routes/guideRoutes');

const app = express();

// CORS options
const corsOptions = {
  origin: `${process.env.FRONTEND_URL}`,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(bodyParser.json());  // Parse JSON bodies
connectDB(); // MongoDB connection

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Directory setup for uploaded files
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const guideImagesDir = path.join(__dirname, 'GuideImages');
if (!fs.existsSync(guideImagesDir)) fs.mkdirSync(guideImagesDir, { recursive: true });

app.use('/uploads', express.static(uploadDir));
app.use('/GuideImages', express.static(guideImagesDir));

app.use('/api', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/guides', guideRoutes);

// Start server
module.exports = (req, res) => {
  app(req, res);
};
