require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/tms_prod';
const ATLAS_URI = process.env.MONGODB_URI;

async function migrate() {
  console.log('Connecting to local MongoDB:', LOCAL_URI);
  const localConn = await mongoose.createConnection(LOCAL_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).asPromise();
  console.log('Connected to Local MongoDB!');

  console.log('\nConnecting to MongoDB Atlas...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).asPromise();
  console.log('Connected to MongoDB Atlas!');

  const collections = ['departments', 'programmes', 'blocks', 'rooms', 'roles', 'users', 'complaints'];

  for (const collName of collections) {
    console.log(`\n--- Migrating collection: ${collName} ---`);
    const localDocs = await localConn.db.collection(collName).find({}).toArray();
    console.log(`Found ${localDocs.length} documents in local ${collName}`);

    if (localDocs.length > 0) {
      const atlasColl = atlasConn.db.collection(collName);
      for (const doc of localDocs) {
        await atlasColl.replaceOne({ _id: doc._id }, doc, { upsert: true });
      }
      console.log(`✓ Migrated ${localDocs.length} documents to Atlas ${collName}`);
    }
  }

  // Ensure all standard roles exist in Atlas
  console.log('\n--- Ensuring Standard Roles in Atlas ---');
  const standardRoles = [
    { name: 'SuperAdmin', description: 'Full system administrator privileges', permissions: ['all'], isActive: true },
    { name: 'User', description: 'Student / Faculty / Staff end user', permissions: ['create_complaint', 'view_own_complaints'], isActive: true },
    { name: 'Networking Staff', description: 'Campus network & internet maintenance', permissions: ['view_assigned', 'update_complaint_status'], isActive: true },
    { name: 'Plumber', description: 'Water & plumbing maintenance', permissions: ['view_assigned', 'update_complaint_status'], isActive: true },
    { name: 'Electrician', description: 'Power & electrical maintenance', permissions: ['view_assigned', 'update_complaint_status'], isActive: true },
    { name: 'Software Developer', description: 'Software & portal issue resolution', permissions: ['view_assigned', 'update_complaint_status'], isActive: true },
    { name: 'Application', description: 'Application & mobile system support', permissions: ['view_assigned', 'update_complaint_status'], isActive: true },
    { name: 'PC Hardware', description: 'Lab computers, monitors, peripherals repair', permissions: ['view_assigned', 'update_complaint_status'], isActive: true },
  ];

  for (const r of standardRoles) {
    await atlasConn.db.collection('roles').updateOne(
      { name: r.name },
      { $set: r },
      { upsert: true }
    );
  }
  console.log('✓ Standard roles updated');

  console.log('\n=========================================');
  console.log('🎉 Migration to MongoDB Atlas Completed Successfully!');
  console.log('=========================================\n');

  await localConn.close();
  await atlasConn.close();
}

module.exports = { migrate };

if (require.main === module) {
  migrate().catch(err => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  });
}
