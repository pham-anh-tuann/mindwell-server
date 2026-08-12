const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testId: {
    type: String,
    required: true
  },
  testTitle: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  result: {
    type: String, 
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
 status: {
    type: String,
    enum: ['safe', 'pending', 'in_progress', 'resolved'],
    default: 'safe' 
  },
  isRedFlag: {
    type: Boolean,
    default: false 
  },
  logs: [{
    time: { type: Date, default: Date.now },
    action: String,
    user: String 
  }]
});

testResultSchema.index({ user: 1, testId: 1, createdAt: -1 });
module.exports = mongoose.model('TestResult', testResultSchema);