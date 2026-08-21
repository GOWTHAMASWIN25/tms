const mongoose = require('mongoose');

const programmeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide programme name'],
      trim: true,
    },
    shortName: {
      type: String,
      required: [true, 'Please provide programme short name'],
      uppercase: true,
      minlength: 2,
      maxlength: 8,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
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

programmeSchema.index({ name: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Programme', programmeSchema);
