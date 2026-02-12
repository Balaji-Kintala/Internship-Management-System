const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'],
      default: 'multiple-choice'
    },
    options: [{
      type: String
    }],
    correctAnswer: {
      type: String
    },
    points: {
      type: Number,
      default: 1
    }
  }],
  duration: {
    type: Number, // in minutes
    required: true,
    default: 60
  },
  passingScore: {
    type: Number,
    required: true,
    default: 70
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attempts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answers: [{
      questionIndex: Number,
      answer: String
    }],
    score: Number,
    percentage: Number,
    passed: Boolean,
    startedAt: Date,
    submittedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate total points before saving
examSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  }
  next();
});

module.exports = mongoose.model('Exam', examSchema);
