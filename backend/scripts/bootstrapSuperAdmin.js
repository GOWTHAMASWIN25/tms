require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('../models/Department');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tms_test';

async function run() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const deptName = 'Admin Department';
  const shortName = 'ADM001';
  let dept = await Department.findOne({ shortName });
  if (!dept) {
    dept = await Department.create({ name: deptName, shortName });
    console.log('Created department:', dept._id);
  } else {
    console.log('Department exists:', dept._id);
  }

  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'Passw0rd!';
  const username = process.argv[4] || 'superadmin';

  let user = await User.findOne({ email });
  if (!user) {
    const hashed = await bcrypt.hash(password, 10);
    user = await User.create({ username, email, phone: '0000000000', password: hashed, role: 'SuperAdmin', department: dept._id });
    console.log('Created SuperAdmin user:', user._id);
  } else {
    console.log('User already exists:', user._id);
  }

  mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
