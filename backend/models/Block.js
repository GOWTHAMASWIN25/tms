const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide block name'],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    programme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Programme',
      required: true,
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

blockSchema.index({ name: 1, department: 1, programme: 1 }, { unique: true });

module.exports = mongoose.model('Block', blockSchema);
