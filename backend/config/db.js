const mongoose = require('mongoose');

// Log the value of MONGO_URI to check if it's loaded correctly
console.log('Mongo URI:', process.env.MONGODB_URI); // Logs the MongoDB URI to confirm it's loaded

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      ssl: true,  // Explicitly enable SSL
      tls: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;


