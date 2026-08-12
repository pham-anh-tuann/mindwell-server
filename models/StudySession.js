const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task',
    default: null 
  },
  duration: { 
    type: Number, 
    required: true,
    default: 25 
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'running'], 
    default: 'running'
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: { 
    type: Date,
    default: null 
  }
}, { timestamps: true });

module.exports = mongoose.model('StudySession', studySessionSchema);