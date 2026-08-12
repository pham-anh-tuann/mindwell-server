const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  response: { type: String },
  audioUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

chatSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('Chat', chatSchema);