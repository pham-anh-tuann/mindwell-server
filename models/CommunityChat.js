const mongoose = require('mongoose');

const communityChatSchema = new mongoose.Schema({
  user: {
    _id: { type: String, required: true },
    name: String,
    avatar: String
  },
  text: { type: String },
  sticker: { type: String }, 
  isDeleted: { type: Boolean, default: false }, 
  reactions: [
    {
      userId: String,
      userName: String,
      emoji: String
    }
  ]
}, { timestamps: true });
module.exports = mongoose.model('CommunityChat', communityChatSchema);