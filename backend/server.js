const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ===============================
// Middlewares
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// Serve Frontend Files
// ===============================
app.use(express.static(path.join(__dirname, '../frontend')));

// ===============================
// API Routes
// ===============================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// ===============================
// Homepage
// Opens login page when visiting
// https://your-app.onrender.com/
// ===============================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// ===============================
// API Health Check
// https://your-app.onrender.com/api
// ===============================
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'Campus Task Manager API is running...',
    version: '1.0.0'
  });
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

// ===============================
// Handle Unhandled Promise Rejections
// ===============================
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);

  server.close(() => {
    process.exit(1);
  });
});