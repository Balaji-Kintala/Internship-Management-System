const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  tasksAssigned: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  attendance: [{
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present'
    },
    notes: String
  }],
  reviews: [{
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  milestones: [{
    title: String,
    description: String,
    achievedAt: {
      type: Date,
      default: Date.now
    }
  }],
  overallRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Progress', progressSchema);
