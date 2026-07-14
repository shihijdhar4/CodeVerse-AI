const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Compile Error', 'Time Limit Exceeded', 'Runtime Error', 'Pending'],
    default: 'Pending'
  },
  score: {
    type: Number,
    default: 0
  },
  executionTime: {
    type: Number, // execution time in ms (or s)
    default: 0
  },
  memoryUsage: {
    type: Number, // memory usage in KB (or MB)
    default: 0
  },
  testCasesPassed: {
    type: Number,
    default: 0
  },
  testCasesTotal: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', submissionSchema);
