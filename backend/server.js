process.env.TZ = 'Asia/Kolkata';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospitalDB';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    const isLocal = MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost');
    console.log(`Successfully connected to ${isLocal ? 'local' : 'Atlas'} MongoDB.`);
    app.listen(PORT, () => {
      console.log(`Express server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failure:', error);
    process.exit(1);
  });
