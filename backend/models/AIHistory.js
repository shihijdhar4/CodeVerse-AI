const mongoose = require('mongoose');

const aiHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['explain', 'review', 'optimize', 'chat', 'challenge_gen'],
    required: true
  },
  score: {
    type: Number, // Optional score for code review
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AIHistory', aiHistorySchema);
