const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const path = require('path');

exports.createComplaint = async (req, res) => {
  try {
    const {
      title,
      departmentName,
      blockName,
      roomNumber,
      complaintType,
      priority,
      contactPhone,
      remarks,
      userId,
    } = req.body;

    if (!blockName || !roomNumber || !complaintType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Only SuperAdmin and regular Users can create complaints
    const requester = req.user || {};
    if (requester.role && !['SuperAdmin', 'User'].includes(requester.role)) {
      return res.status(403).json({ message: 'You do not have permission to create complaints' });
    }

    const complaintTitle = (title && title.trim())
      ? title.trim()
      : `${complaintType} - ${blockName} / ${roomNumber}`;

    const complaint = new Complaint({
      title: complaintTitle,
      departmentName,
      blockName,
      roomNumber,
      complaintType,
      priority: priority || 'Medium',
      contactPhone: contactPhone || '',
      remarks,
      createdBy: req.user?.id || userId,
      timeline: [
        {
          action: 'Ticket Created',
          status: 'Pending',
          note: remarks ? remarks.slice(0, 150) : 'Ticket submitted',
          byName: requester.username || 'User',
          byRole: requester.role || 'User',
          timestamp: new Date(),
        },
      ],
    });

    if (req.file) {
      complaint.attachment = `/uploads/${req.file.filename}`;
    }

    await complaint.save();

    res.status(201).json({ message: 'Complaint created successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create complaint', error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    let complaints = [];

    if (requester.role === 'SuperAdmin') {
      complaints = await Complaint.find();
    } else if (!['SuperAdmin', 'User'].includes(requester.role)) {
      let filter = { assignedTo: requester.id };
      if (requester.department) {
        const sameDeptStaff = await User.find({ department: requester.department }).select('_id');
        const staffIds = sameDeptStaff.map((u) => u._id);
        filter = {
          $or: [{ assignedTo: { $in: staffIds } }, { createdBy: requester.id }],
        };
      }
      complaints = await Complaint.find(filter);
    } else {
      complaints = await Complaint.find({ createdBy: requester.id });
    }

    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === 'Pending').length;
    const assigned = complaints.filter((c) => c.status === 'Assigned').length;
    const inProgress = complaints.filter((c) => c.status === 'In-Progress').length;
    const onhold = complaints.filter((c) => c.status === 'Onhold').length;
    const closed = complaints.filter((c) => c.status === 'Closed').length;

    const urgent = complaints.filter((c) => c.priority === 'Urgent').length;
    const high = complaints.filter((c) => c.priority === 'High').length;
    const medium = complaints.filter((c) => c.priority === 'Medium').length;
    const low = complaints.filter((c) => c.priority === 'Low').length;

    const ratedList = complaints.filter((c) => c.rating && c.rating > 0);
    const avgRating = ratedList.length
      ? (ratedList.reduce((acc, c) => acc + c.rating, 0) / ratedList.length).toFixed(1)
      : '5.0';

    return res.json({
      total,
      pending,
      assigned,
      inProgress,
      onhold,
      closed,
      urgent,
      high,
      medium,
      low,
      avgRating,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

exports.listComplaints = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    let query = {};
    if (requester.role === 'SuperAdmin') {
      query = {};
    } else if (!['SuperAdmin', 'User'].includes(requester.role)) {
      if (requester.department) {
        const sameDeptStaff = await User.find({ department: requester.department }).select('_id');
        const staffIds = sameDeptStaff.map((u) => u._id);
        query = {
          $or: [{ assignedTo: { $in: staffIds } }, { createdBy: requester.id }],
        };
      } else {
        query = { assignedTo: requester.id };
      }
    } else {
      query = { createdBy: requester.id };
    }

    const complaints = await Complaint.find(query)
      .populate({
        path: 'createdBy',
        select: 'username email department',
        populate: { path: 'department', select: 'name' },
      })
      .populate({
        path: 'assignedTo',
        select: 'username email role department',
        populate: { path: 'department', select: 'name' },
      })
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
    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ message: 'assignedTo is required' });

    const assignee = await User.findById(assignedTo);
    if (!assignee) return res.status(404).json({ message: 'Assignee not found' });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.assignedTo = assignee._id;
    complaint.status = 'Assigned';
    if (!complaint.timeline) complaint.timeline = [];
    complaint.timeline.push({
      action: `Assigned to ${assignee.username}`,
      status: 'Assigned',
      note: `Ticket assigned to ${assignee.username} (${assignee.role || 'Staff'})`,
      byName: requester.username || 'Admin',
      byRole: requester.role || 'SuperAdmin',
      timestamp: new Date(),
    });

    await complaint.save();

    const updated = await Complaint.findById(complaintId)
      .populate('assignedTo', 'username email role')
      .populate('createdBy', 'username email');
    res.json({ message: 'Assigned successfully', complaint: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign complaint', error: error.message });
  }
};

// Assigned staff (or SuperAdmin) can update status
exports.updateStatus = async (req, res) => {
  try {
    const requester = req.user;
    const complaintId = req.params.id;
    let { status, resolutionNotes } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });

    if (status === 'Completed') status = 'Closed';

    const allowedStatuses = ['Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate('assignedTo', '_id')
      .populate('createdBy', '_id');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const isAssignee =
      complaint.assignedTo && String(complaint.assignedTo._id) === String(requester.id);
    const isCreator =
      complaint.createdBy &&
      String(complaint.createdBy._id || complaint.createdBy) === String(requester.id);

    if (requester.role !== 'SuperAdmin' && !isAssignee && !isCreator) {
      return res
        .status(403)
        .json({ message: 'Only assigned staff or complaint creator can update status' });
    }

    if (isAssignee && requester.role !== 'SuperAdmin') {
      const staffAllowed = ['In-Progress', 'Onhold', 'Closed'];
      if (!staffAllowed.includes(status)) {
        return res.status(403).json({ message: 'Assigned staff cannot set this status' });
      }
    }

    if (isCreator && requester.role !== 'SuperAdmin') {
      const creatorAllowed = ['Pending', 'Closed'];
      if (!creatorAllowed.includes(status)) {
        return res.status(403).json({ message: 'Complaint creator cannot set this status' });
      }
    }

    complaint.status = status;
    if (resolutionNotes) {
      complaint.resolutionNotes = resolutionNotes;
    }
    if (status === 'Closed') {
      complaint.resolvedAt = new Date();
    }

    if (!complaint.timeline) complaint.timeline = [];
    complaint.timeline.push({
      action: `Status updated to ${status}`,
      status,
      note: resolutionNotes || `Status updated to ${status}`,
      byName: requester.username || 'User',
      byRole: requester.role || 'Staff',
      timestamp: new Date(),
    });

    await complaint.save();
    const updated = await Complaint.findById(complaintId)
      .populate('assignedTo', 'username email role')
      .populate('createdBy', 'username email');
    res.json({ message: 'Status updated successfully', complaint: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// Add Star Rating and Feedback
exports.addFeedback = async (req, res) => {
  try {
    const requester = req.user;
    const complaintId = req.params.id;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const isCreator =
      complaint.createdBy && String(complaint.createdBy) === String(requester.id);
    if (!isCreator && requester.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only ticket creator can submit rating & feedback' });
    }

    if (complaint.status !== 'Closed') {
      return res.status(400).json({ message: 'Can only submit feedback for resolved tickets' });
    }

    complaint.rating = Number(rating);
    complaint.feedback = feedback || '';

    if (!complaint.timeline) complaint.timeline = [];
    complaint.timeline.push({
      action: 'Feedback Submitted',
      status: complaint.status,
      note: `Rated ${rating}/5 ⭐. ${feedback ? `Comment: "${feedback}"` : ''}`,
      byName: requester.username || 'User',
      byRole: requester.role || 'User',
      timestamp: new Date(),
    });

    await complaint.save();
    res.json({ message: 'Feedback submitted successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
};

// Add Timeline Note
exports.addTimelineNote = async (req, res) => {
  try {
    const requester = req.user;
    const complaintId = req.params.id;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (!complaint.timeline) complaint.timeline = [];
    complaint.timeline.push({
      action: 'Progress Note',
      status: complaint.status,
      note: note.trim(),
      byName: requester.username || 'Staff',
      byRole: requester.role || 'Staff',
      timestamp: new Date(),
    });

    await complaint.save();
    res.json({ message: 'Note added to timeline', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add note', error: error.message });
  }
};

// Get a single complaint by ID
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate({
        path: 'createdBy',
        select: 'username email department phone',
        populate: { path: 'department', select: 'name' },
      })
      .populate({
        path: 'assignedTo',
        select: 'username email role department phone',
        populate: { path: 'department', select: 'name' },
      });

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
    if (!requester || requester.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can generate reports' });
    }

    const { department, programme, complaintType, priority, status, assignee } = req.query;

    const filter = {};
    if (complaintType) filter.complaintType = complaintType;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (assignee) filter.assignedTo = assignee;

    let departmentNameFilter = null;
    if (department) {
      const deptDoc = await Department.findById(department);
      if (deptDoc) {
        departmentNameFilter = deptDoc.name;
      }
    }

    if (department || programme) {
      const userQuery = {};
      if (department) userQuery.department = department;
      if (programme) userQuery.programme = programme;
      const users = await User.find(userQuery).select('_id');
      const userIds = users.map((u) => u._id);

      const conditions = [];
      if (userIds.length > 0) {
        conditions.push({ createdBy: { $in: userIds } });
      }
      if (departmentNameFilter) {
        conditions.push({ departmentName: departmentNameFilter });
      }

      if (conditions.length > 0) {
        filter.$or = conditions;
      } else {
        return res.json([]);
      }
    }

    const complaints = await Complaint.find(filter)
      .populate({
        path: 'createdBy',
        select: 'username email department',
        populate: { path: 'department', select: 'name' },
      })
      .populate({ path: 'assignedTo', select: 'username email role' })
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};
