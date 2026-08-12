const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  iconName: { type: String, default: 'default' },
  isCustom: { type: Boolean, default: true },
  completedDates: [String] 
}, {
  timestamps: true
});

habitSchema.index({ user: 1 });
module.exports = mongoose.model('Habit', habitSchema);