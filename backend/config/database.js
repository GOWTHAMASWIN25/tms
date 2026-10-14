const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/tms_prod';

  try {
    console.log('Connecting to primary MongoDB (Atlas)...');
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB Connected successfully to Atlas!');
  } catch (error) {
    console.warn('\n⚠️  MongoDB Atlas is currently unreachable (IP whitelist required in Atlas dashboard).');
    console.log('🔄 Automatically falling back to local MongoDB:', localUri);
    try {
      await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 4000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✓ MongoDB Connected successfully to Local Database! Server is active.\n');
    } catch (fallbackErr) {
      console.error('❌ Failed to connect to both Atlas and Local MongoDB:', fallbackErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
