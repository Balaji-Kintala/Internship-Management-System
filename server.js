const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const taskRoutes = require('./routes/tasks');
const resourceRoutes = require('./routes/resources');
const examRoutes = require('./routes/exams');
const progressRoutes = require('./routes/progress');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internship_management';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/progress', progressRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  console.log('Serving frontend in production mode...');
  const buildPath = path.join(__dirname, 'client', 'build');
  console.log('Static files path:', buildPath);
  
  app.use(express.static(buildPath));

  // Debug route to check files
  app.get('/api/debug-files', (req, res) => {
    const fs = require('fs');
    if (fs.existsSync(buildPath)) {
      const files = fs.readdirSync(buildPath);
      res.json({ buildPath, files });
    } else {
      res.status(404).json({ error: 'Build path not found', buildPath });
    }
  });

  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('index.html not found in build directory. Check if build was successful.');
    }
  });
} else {
  console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
}

const fs = require('fs'); // Ensure fs is available if needed outside the block

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
