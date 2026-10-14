const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    departmentName: { type: String },
    blockName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    complaintType: { type: String, required: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    contactPhone: { type: String, default: '' },
    remarks: { type: String },
    resolutionNotes: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, default: '' },
    attachment: { type: String }, // file path
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'],
      default: 'Pending',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: { type: Date },
    timeline: [
      {
        action: { type: String },
        status: { type: String },
        note: { type: String },
        byName: { type: String },
        byRole: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
