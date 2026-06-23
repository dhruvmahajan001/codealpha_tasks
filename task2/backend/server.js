require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = async () => {
  // Configured in config/db.js but importing directly or via require
  const db = require('./config/db');
  await db();
};
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Allow cross-origin requests

// Increase size limit to accommodate base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base API route check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ConnectHub API is running smoothly...',
    version: '1.0.0'
  });
});

// Bind API Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Fallback Middlewares
app.use(notFound);
app.use(errorHandler);

// Listen on Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
