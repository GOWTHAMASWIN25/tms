const mongoose = require('mongoose');

const DEFAULT_ATLAS_URI = 'mongodb+srv://gowthamaswin9578_db_user:gowthem0066@cluster0.u6immzj.mongodb.net/tms_prod?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || DEFAULT_ATLAS_URI;
  const localUri = 'mongodb://127.0.0.1:27017/tms_prod';

  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 15000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB Connected successfully to Atlas!');
    return;
  } catch (error) {
    console.error('⚠️ Atlas connection failed:', error.message);
  }

  // Only attempt local fallback if running locally and NOT on Render/cloud
  if (!process.env.RENDER && process.env.NODE_ENV !== 'production') {
    try {
      console.log('🔄 Attempting local MongoDB fallback:', localUri);
      await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 4000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✓ Connected to Local MongoDB fallback!');
      return;
    } catch (fallbackErr) {
      console.error('❌ Local MongoDB fallback also failed:', fallbackErr.message);
    }
  }

  console.log('⏳ MongoDB connection will retry in 5 seconds...');
  setTimeout(connectDB, 5000);
};

module.exports = connectDB;
