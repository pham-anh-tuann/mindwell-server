const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    required: true 
  }, 
  title: { 
    type: String, 
    required: true 
  },
  desc: { 
    type: String, 
    required: true 
  },
  time: { 
    type: String, 
    default: 'Vừa xong' 
  },
  read: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true }); 

notificationSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);