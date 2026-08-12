const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },

  type: {
    type: String,
    enum: ['class', 'exam', 'assignment', 'other'], 
    default: 'assignment'
  },
  
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  targetPomodoros: { 
    type: Number, 
    default: 1 
  },

  colorTag: {
    type: String,
    default: '#E5E7EB' 
  },
  location: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);