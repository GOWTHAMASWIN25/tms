require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Role = require('../models/Role');
const Department = require('../models/Department');
const Programme = require('../models/Programme');
const Block = require('../models/Block');
const Room = require('../models/Room');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in backend/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  console.log('URI:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));

  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB successfully!');

  // 1. Seed Roles
  console.log('\n--- Seeding Roles ---');
  const roleDefinitions = [
    { name: 'SuperAdmin', description: 'Full system administrator privileges', permissions: ['all'] },
    { name: 'User', description: 'Student / Faculty / Staff end user', permissions: ['create_complaint', 'view_own_complaints'] },
    { name: 'Networking Staff', description: 'Campus network & internet maintenance', permissions: ['view_assigned', 'update_complaint_status'] },
    { name: 'Plumber', description: 'Water & plumbing maintenance', permissions: ['view_assigned', 'update_complaint_status'] },
    { name: 'Electrician', description: 'Power & electrical maintenance', permissions: ['view_assigned', 'update_complaint_status'] },
    { name: 'Software Developer', description: 'Software & portal issue resolution', permissions: ['view_assigned', 'update_complaint_status'] },
    { name: 'Application', description: 'Application & mobile system support', permissions: ['view_assigned', 'update_complaint_status'] },
    { name: 'PC Hardware', description: 'Lab computers, monitors, peripherals repair', permissions: ['view_assigned', 'update_complaint_status'] },
  ];

  for (const r of roleDefinitions) {
    await Role.findOneAndUpdate({ name: r.name }, r, { upsert: true, new: true });
    console.log(`  ✓ Role: ${r.name}`);
  }

  // 2. Seed Departments
  console.log('\n--- Seeding Departments ---');
  const departmentsData = [
    { name: 'Computer Science and Engineering', shortName: 'CSE', description: 'Department of Computer Science & Engineering' },
    { name: 'Information Technology', shortName: 'IT', description: 'Department of Information Technology' },
    { name: 'Electrical and Electronics Engineering', shortName: 'EEE', description: 'Department of Electrical & Electronics' },
    { name: 'Mechanical Engineering', shortName: 'MECH', description: 'Department of Mechanical Engineering' },
    { name: 'Campus Administration', shortName: 'ADMIN', description: 'Central campus management & facilities' },
  ];

  const deptMap = {};
  for (const dept of departmentsData) {
    const doc = await Department.findOneAndUpdate({ shortName: dept.shortName }, dept, { upsert: true, new: true });
    deptMap[dept.shortName] = doc;
    console.log(`  ✓ Department: ${dept.name} (${dept.shortName})`);
  }

  // 3. Seed Programmes
  console.log('\n--- Seeding Programmes ---');
  const programmesData = [
    { name: 'B.E Computer Science and Engineering', shortName: 'BECSE', department: deptMap['CSE']._id, description: 'Undergraduate CSE' },
    { name: 'M.E Computer Science and Engineering', shortName: 'MECSE', department: deptMap['CSE']._id, description: 'Postgraduate CSE' },
    { name: 'B.Tech Information Technology', shortName: 'BTIT', department: deptMap['IT']._id, description: 'Undergraduate IT' },
    { name: 'B.E Electrical and Electronics', shortName: 'BEEEE', department: deptMap['EEE']._id, description: 'Undergraduate EEE' },
    { name: 'B.E Mechanical Engineering', shortName: 'BEMECH', department: deptMap['MECH']._id, description: 'Undergraduate Mech' },
    { name: 'Campus Admin Services', shortName: 'ADMSVC', department: deptMap['ADMIN']._id, description: 'Administration Staff' },
  ];

  const progMap = {};
  for (const prog of programmesData) {
    const doc = await Programme.findOneAndUpdate(
      { name: prog.name, department: prog.department },
      prog,
      { upsert: true, new: true }
    );
    progMap[prog.shortName] = doc;
    console.log(`  ✓ Programme: ${prog.name} (${prog.shortName})`);
  }

  // 4. Seed Blocks
  console.log('\n--- Seeding Blocks ---');
  const blocksData = [
    { name: 'Dr. APJ Abdul Kalam IT Block', department: deptMap['CSE']._id, programme: progMap['BECSE']._id, description: 'Main IT and Computer Labs Building' },
    { name: 'Sir CV Raman Science Block', department: deptMap['IT']._id, programme: progMap['BTIT']._id, description: 'IT Classrooms & Lecture Halls' },
    { name: 'Nikola Tesla Tech Block', department: deptMap['EEE']._id, programme: progMap['BEEEE']._id, description: 'Electrical Systems and High Voltage Labs' },
    { name: 'Central Administration Block', department: deptMap['ADMIN']._id, programme: progMap['ADMSVC']._id, description: 'Administrative Offices & Directorate' },
  ];

  const blockMap = {};
  for (const blk of blocksData) {
    const doc = await Block.findOneAndUpdate(
      { name: blk.name, department: blk.department, programme: blk.programme },
      blk,
      { upsert: true, new: true }
    );
    blockMap[blk.name] = doc;
    console.log(`  ✓ Block: ${blk.name}`);
  }

  // 5. Seed Rooms
  console.log('\n--- Seeding Rooms ---');
  const itBlock = blockMap['Dr. APJ Abdul Kalam IT Block'];
  const adminBlock = blockMap['Central Administration Block'];
  const teslaBlock = blockMap['Nikola Tesla Tech Block'];

  const roomsData = [
    { roomNumber: 'LAB-101', block: itBlock._id, department: deptMap['CSE']._id, programme: progMap['BECSE']._id, floor: 1, capacity: 60, description: 'Programming & Data Structures Lab' },
    { roomNumber: 'LAB-102', block: itBlock._id, department: deptMap['CSE']._id, programme: progMap['BECSE']._id, floor: 1, capacity: 60, description: 'AI & Data Science Research Lab' },
    { roomNumber: 'CR-201', block: itBlock._id, department: deptMap['CSE']._id, programme: progMap['BECSE']._id, floor: 2, capacity: 70, description: 'Smart Classroom 201' },
    { roomNumber: 'SERVER-01', block: itBlock._id, department: deptMap['CSE']._id, programme: progMap['BECSE']._id, floor: 1, capacity: 10, description: 'Central Campus Server Room' },
    { roomNumber: 'POWER-LAB', block: teslaBlock._id, department: deptMap['EEE']._id, programme: progMap['BEEEE']._id, floor: 1, capacity: 45, description: 'Electrical Machines Lab' },
    { roomNumber: 'ADMIN-301', block: adminBlock._id, department: deptMap['ADMIN']._id, programme: progMap['ADMSVC']._id, floor: 3, capacity: 25, description: 'Principal & Dean Conference Room' },
  ];

  const roomMap = {};
  for (const rm of roomsData) {
    const doc = await Room.findOneAndUpdate(
      { roomNumber: rm.roomNumber, block: rm.block },
      rm,
      { upsert: true, new: true }
    );
    roomMap[rm.roomNumber] = doc;
    console.log(`  ✓ Room: ${rm.roomNumber} (${rm.description})`);
  }

  // 6. Seed Users
  console.log('\n--- Seeding Users ---');
  const defaultPassword = 'Passw0rd!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const usersData = [
    {
      username: 'superadmin',
      email: 'admin@example.com',
      phone: '9876543210',
      password: hashedPassword,
      role: 'SuperAdmin',
      department: deptMap['ADMIN']._id,
      programme: progMap['ADMSVC']._id,
      isActive: true,
    },
    {
      username: 'admin2',
      email: 'superadmin@example.com',
      phone: '9876543211',
      password: hashedPassword,
      role: 'SuperAdmin',
      department: deptMap['ADMIN']._id,
      programme: progMap['ADMSVC']._id,
      isActive: true,
    },
    {
      username: 'gowtham_user',
      email: 'user@example.com',
      phone: '9876543220',
      password: hashedPassword,
      role: 'User',
      department: deptMap['CSE']._id,
      programme: progMap['BECSE']._id,
      isActive: true,
    },
    {
      username: 'net_engineer',
      email: 'network@example.com',
      phone: '9876543230',
      password: hashedPassword,
      role: 'Networking Staff',
      department: deptMap['ADMIN']._id,
      programme: progMap['ADMSVC']._id,
      isActive: true,
    },
    {
      username: 'plumb_master',
      email: 'plumber@example.com',
      phone: '9876543240',
      password: hashedPassword,
      role: 'Plumber',
      department: deptMap['ADMIN']._id,
      programme: progMap['ADMSVC']._id,
      isActive: true,
    },
    {
      username: 'spark_expert',
      email: 'electrician@example.com',
      phone: '9876543250',
      password: hashedPassword,
      role: 'Electrician',
      department: deptMap['EEE']._id,
      programme: progMap['BEEEE']._id,
      isActive: true,
    },
    {
      username: 'hw_technician',
      email: 'hardware@example.com',
      phone: '9876543260',
      password: hashedPassword,
      role: 'PC Hardware',
      department: deptMap['CSE']._id,
      programme: progMap['BECSE']._id,
      isActive: true,
    },
    {
      username: 'dev_analyst',
      email: 'software@example.com',
      phone: '9876543270',
      password: hashedPassword,
      role: 'Software Developer',
      department: deptMap['CSE']._id,
      programme: progMap['BECSE']._id,
      isActive: true,
    },
  ];

  const userMap = {};
  for (const u of usersData) {
    let doc = await User.findOne({ email: u.email });
    if (!doc) {
      doc = await User.create(u);
    } else {
      doc.role = u.role;
      doc.department = u.department;
      doc.programme = u.programme;
      doc.password = hashedPassword;
      await doc.save();
    }
    userMap[u.role] = doc;
    console.log(`  ✓ User: ${u.username} (${u.email}) [${u.role}]`);
  }

  // 7. Seed Sample Complaints
  console.log('\n--- Seeding Initial Complaints ---');
  const studentUser = await User.findOne({ email: 'user@example.com' });
  const superAdmin = await User.findOne({ email: 'admin@example.com' });
  const hwStaff = userMap['PC Hardware'];
  const netStaff = userMap['Networking Staff'];
  const elecStaff = userMap['Electrician'];

  const complaintsData = [
    {
      title: 'Monitors not powering on in Lab 101 Station 12-15',
      departmentName: 'Computer Science and Engineering',
      blockName: 'Dr. APJ Abdul Kalam IT Block',
      roomNumber: 'LAB-101',
      complaintType: 'PC Hardware',
      priority: 'High',
      contactPhone: '9876543220',
      remarks: '4 workstations failed to display video output during morning lab session.',
      status: 'Assigned',
      assignedTo: hwStaff?._id,
      createdBy: studentUser._id,
      timeline: [
        {
          action: 'Created',
          status: 'Pending',
          note: 'Complaint registered by student',
          byName: 'gowtham_user',
          byRole: 'User',
          timestamp: new Date(Date.now() - 3600000 * 24),
        },
        {
          action: 'Assigned',
          status: 'Assigned',
          note: 'Assigned to PC Hardware specialist',
          byName: 'superadmin',
          byRole: 'SuperAdmin',
          timestamp: new Date(Date.now() - 3600000 * 12),
        },
      ],
    },
    {
      title: 'Wi-Fi Access Point offline in Smart Classroom 201',
      departmentName: 'Computer Science and Engineering',
      blockName: 'Dr. APJ Abdul Kalam IT Block',
      roomNumber: 'CR-201',
      complaintType: 'Network',
      priority: 'Urgent',
      contactPhone: '9876543220',
      remarks: 'Students and lecturer cannot connect to campus intranet. SSID is not broadcasting.',
      status: 'In-Progress',
      assignedTo: netStaff?._id,
      createdBy: studentUser._id,
      timeline: [
        {
          action: 'Created',
          status: 'Pending',
          note: 'Complaint registered by student',
          byName: 'gowtham_user',
          byRole: 'User',
          timestamp: new Date(Date.now() - 3600000 * 18),
        },
        {
          action: 'Assigned',
          status: 'Assigned',
          note: 'Assigned to Network Engineer',
          byName: 'superadmin',
          byRole: 'SuperAdmin',
          timestamp: new Date(Date.now() - 3600000 * 6),
        },
        {
          action: 'In-Progress',
          status: 'In-Progress',
          note: 'Diagnosing PoE switch and patch cable in server rack',
          byName: 'net_engineer',
          byRole: 'Networking Staff',
          timestamp: new Date(Date.now() - 3600000 * 2),
        },
      ],
    },
    {
      title: 'AC unit tripping circuit breaker in Power Lab',
      departmentName: 'Electrical and Electronics Engineering',
      blockName: 'Nikola Tesla Tech Block',
      roomNumber: 'POWER-LAB',
      complaintType: 'Electronics',
      priority: 'Medium',
      contactPhone: '9876543220',
      remarks: 'Main breaker trips whenever AC 2 is switched on.',
      status: 'Pending',
      createdBy: studentUser._id,
      timeline: [
        {
          action: 'Created',
          status: 'Pending',
          note: 'Ticket submitted',
          byName: 'gowtham_user',
          byRole: 'User',
          timestamp: new Date(Date.now() - 3600000 * 5),
        },
      ],
    },
    {
      title: 'Water tap leaking near restroom corridor',
      departmentName: 'Campus Administration',
      blockName: 'Central Administration Block',
      roomNumber: 'ADMIN-301',
      complaintType: 'Plumbing',
      priority: 'Low',
      contactPhone: '9876543210',
      remarks: 'Valve gasket worn out, minor continuous leak.',
      resolutionNotes: 'Replaced rubber washer and sealed threaded valve joint.',
      rating: 5,
      feedback: 'Resolved very quickly! Thank you.',
      status: 'Closed',
      assignedTo: userMap['Plumber']?._id,
      createdBy: superAdmin._id,
      resolvedAt: new Date(),
      timeline: [
        {
          action: 'Created',
          status: 'Pending',
          note: 'Ticket created',
          byName: 'superadmin',
          byRole: 'SuperAdmin',
          timestamp: new Date(Date.now() - 3600000 * 48),
        },
        {
          action: 'Assigned',
          status: 'Assigned',
          note: 'Assigned to Plumber',
          byName: 'superadmin',
          byRole: 'SuperAdmin',
          timestamp: new Date(Date.now() - 3600000 * 36),
        },
        {
          action: 'Closed',
          status: 'Closed',
          note: 'Fixed washer and tested flow',
          byName: 'plumb_master',
          byRole: 'Plumber',
          timestamp: new Date(Date.now() - 3600000 * 24),
        },
      ],
    },
  ];

  for (const c of complaintsData) {
    const existing = await Complaint.findOne({ title: c.title });
    if (!existing) {
      await Complaint.create(c);
      console.log(`  ✓ Complaint: "${c.title}" [${c.status}]`);
    } else {
      console.log(`  ✓ Complaint already exists: "${c.title}"`);
    }
  }

  console.log('\n=========================================');
  console.log('🎉 MongoDB Atlas Seeding Completed Successfully!');
  console.log('=========================================');
  console.log('Login Credentials:');
  console.log('  SuperAdmin : admin@example.com / Passw0rd!');
  console.log('  SuperAdmin : superadmin@example.com / Passw0rd!');
  console.log('  User       : user@example.com / Passw0rd!');
  console.log('  Network    : network@example.com / Passw0rd!');
  console.log('  Hardware   : hardware@example.com / Passw0rd!');
  console.log('  Electrician: electrician@example.com / Passw0rd!');
  console.log('  Plumber    : plumber@example.com / Passw0rd!');
  console.log('  Software   : software@example.com / Passw0rd!');
  console.log('=========================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('\n❌ Seeding Error:', err);
  process.exit(1);
});
