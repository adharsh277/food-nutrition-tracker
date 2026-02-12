const mongoose = require('mongoose');

let isConnected = false; // Track connection status

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  if (isConnected) {
    console.log('✅ MongoDB using existing connection');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'ai-food-scanner', // Explicitly set DB name
    });

    isConnected = db.connections[0].readyState;
    console.log('✅ New MongoDB Connection established');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // Do NOT process.exit(1) in serverless, just throw
    throw error;
  }
};

module.exports = connectDB;
