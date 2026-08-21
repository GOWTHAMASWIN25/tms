const Complaint = require('../models/Complaint');
const User = require('../models/User');
const path = require('path');

exports.createComplaint = async (req, res) => {
  try {
    const { blockName, roomNumber, complaintType, remarks, userId } = req.body;

    if (!blockName || !roomNumber || !complaintType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Only SuperAdmin and regular Users can create complaints
    const requester = req.user || {};
    if (requester.role && !['SuperAdmin', 'User'].includes(requester.role)) {
      return res.status(403).json({ message: 'You do not have permission to create complaints' });
    }

    const complaint = new Complaint({
      blockName,
      roomNumber,
      complaintType,
      remarks,
      createdBy: req.user?.id || userId,
    });

    if (req.file) {
      complaint.attachment = `/uploads/${req.file.filename}`;
    }

    await complaint.save();

    res.status(201).json({ message: 'Complaint created', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create complaint', error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    // SuperAdmin: global stats
    if (requester.role === 'SuperAdmin') {
      const all = await Complaint.find();
      const total = all.length;
      const pending = all.filter((c) => c.status === 'Pending').length;
      const assigned = all.filter((c) => c.status === 'Assigned').length;
      const closed = all.filter((c) => c.status === 'Closed').length;
      return res.json({ total, pending, assigned, closed });
    }

    // Staff/Technician: stats for complaints assigned to them or their department
    if (!['SuperAdmin', 'User'].includes(requester.role)) {
      let filter = { assignedTo: requester.id };
      
      // If staff has a department assigned, also get complaints for all staff in that dept
      if (requester.department) {
        const sameDeptStaff = await User.find({ department: requester.department }).select('_id');
        const staffIds = sameDeptStaff.map(u => u._id);
        filter = {
          $or: [
            { assignedTo: { $in: staffIds } },
            { createdBy: requester.id }
          ]
        };
      } else {
        // Fallback: if no department, just show assigned to this user
        filter = { assignedTo: requester.id };
      }
      
      const assignedList = await Complaint.find(filter);
      const total = assignedList.length;
      const pending = assignedList.filter((c) => c.status === 'Pending').length;
      const assigned = assignedList.filter((c) => c.status === 'Assigned').length;
      const closed = assignedList.filter((c) => c.status === 'Closed').length;
      return res.json({ total, pending, assigned, closed });
    }

    // Regular User: stats for complaints created by them
    const myList = await Complaint.find({ createdBy: requester.id });
    const total = myList.length;
    const pending = myList.filter((c) => c.status === 'Pending').length;
    const assigned = myList.filter((c) => c.status === 'Assigned').length;
    const closed = myList.filter((c) => c.status === 'Closed').length;
    res.json({ total, pending, assigned, closed });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

exports.listComplaints = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    // SuperAdmin: all complaints
    if (requester.role === 'SuperAdmin') {
      const complaints = await Complaint.find()
        .populate({ path: 'createdBy', select: 'username email department', populate: { path: 'department', select: 'name' } })
        .populate({ path: 'assignedTo', select: 'username email role department', populate: { path: 'department', select: 'name' } })
        .sort({ createdAt: -1 });
      return res.json(complaints);
    }

    // Staff/Technician: complaints assigned to them or their department
    if (!['SuperAdmin', 'User'].includes(requester.role)) {
      let filter = { assignedTo: requester.id };
      
      // If staff has a department assigned, also get complaints for all staff in that dept
      if (requester.department) {
        const sameDeptStaff = await User.find({ department: requester.department }).select('_id');
        const staffIds = sameDeptStaff.map(u => u._id);
        filter = {
          $or: [
            { assignedTo: { $in: staffIds } },
            { createdBy: requester.id }
          ]
        };
      }

      const complaints = await Complaint.find(filter)
        .populate({ path: 'createdBy', select: 'username email department', populate: { path: 'department', select: 'name' } })
        .populate({ path: 'assignedTo', select: 'username email role department', populate: { path: 'department', select: 'name' } })
        .sort({ createdAt: -1 });
      return res.json(complaints);
    }

    // Regular User: complaints raised by them
    const complaints = await Complaint.find({ createdBy: requester.id })
      .populate({ path: 'createdBy', select: 'username email department', populate: { path: 'department', select: 'name' } })
      .populate({ path: 'assignedTo', select: 'username email role department', populate: { path: 'department', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list complaints', error: error.message });
  }
};

// SuperAdmin assigns complaint to a staff user
exports.assignComplaint = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || requester.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can assign complaints' });
    }

    const complaintId = req.params.id;
    const { assignedTo } = req.body; // user id
    if (!assignedTo) return res.status(400).json({ message: 'assignedTo is required' });

    const assignee = await User.findById(assignedTo);
    if (!assignee) return res.status(404).json({ message: 'Assignee not found' });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.assignedTo = assignee._id;
    complaint.status = 'Assigned';
    await complaint.save();

    const updated = await Complaint.findById(complaintId).populate('assignedTo', 'username email role');
    res.json({ message: 'Assigned successfully', complaint: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign complaint', error: error.message });
  }
};

// Assigned staff (or SuperAdmin) can update status to Closed
exports.updateStatus = async (req, res) => {
  try {
    const requester = req.user;
    const complaintId = req.params.id;
    let { status } = req.body; // expected 'Closed' or 'Completed'
    if (!status) return res.status(400).json({ message: 'status is required' });

    // Accept 'Completed' as alias for 'Closed'
    if (status === 'Completed') status = 'Closed';

    const allowedStatuses = ['Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate('assignedTo', '_id')
      .populate('createdBy', '_id');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // If requester is SuperAdmin, allow any change
    if (requester.role === 'SuperAdmin') {
      complaint.status = status;
      await complaint.save();
      const updated = await Complaint.findById(complaintId).populate('assignedTo', 'username email');
      return res.json({ message: 'Status updated', complaint: updated });
    }

    // Staff/Technician: must be assignedTo and can set limited statuses
    const isAssignee = complaint.assignedTo && String(complaint.assignedTo._id) === String(requester.id);
    // Complaint creator may also be allowed to change certain statuses (e.g., Pending, Closed)
    const isCreator = complaint.createdBy && String(complaint.createdBy._id || complaint.createdBy) === String(requester.id);

    if (!isAssignee && !isCreator) return res.status(403).json({ message: 'Only assigned staff or complaint creator can update status' });

    if (isAssignee) {
      const staffAllowed = ['In-Progress', 'Onhold', 'Closed'];
      if (!staffAllowed.includes(status)) return res.status(403).json({ message: 'Assigned staff cannot set this status' });
    }

    if (isCreator) {
      const creatorAllowed = ['Pending', 'Closed'];
      if (!creatorAllowed.includes(status)) return res.status(403).json({ message: 'Complaint creator cannot set this status' });
    }

    complaint.status = status;
    await complaint.save();
    const updated = await Complaint.findById(complaintId).populate('assignedTo', 'username email');
    res.json({ message: 'Status updated', complaint: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// Get a single complaint by ID
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate({ path: 'createdBy', select: 'username email department', populate: { path: 'department', select: 'name' } })
      .populate({ path: 'assignedTo', select: 'username email role department', populate: { path: 'department', select: 'name' } });
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch complaint', error: error.message });
  }
};

// SuperAdmin: generate filtered reports
exports.generateReport = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || requester.role !== 'SuperAdmin') return res.status(403).json({ message: 'Only SuperAdmin can generate reports' });

    const { department, programme, complaintType, status, assignee } = req.query;

    const filter = {};
    if (complaintType) filter.complaintType = complaintType;
    if (status) filter.status = status;
    if (assignee) filter.assignedTo = assignee;

    // If department or programme are provided, we need to lookup users in that department/programme and filter by createdBy
    let createdByFilterIds = null;
    if (department || programme) {
      const userQuery = {};
      if (department) userQuery.department = department;
      if (programme) userQuery.programme = programme;
      const users = await User.find(userQuery).select('_id');
      createdByFilterIds = users.map((u) => u._id);
      if (createdByFilterIds.length === 0) {
        // no users -> empty result
        return res.json([]);
      }
      filter.createdBy = { $in: createdByFilterIds };
    }

    const complaints = await Complaint.find(filter)
      .populate({ path: 'createdBy', select: 'username email department', populate: { path: 'department', select: 'name' } })
      .populate({ path: 'assignedTo', select: 'username email role' })
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};
