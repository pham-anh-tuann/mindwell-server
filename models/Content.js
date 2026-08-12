const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['tip', 'news'], 
    required: true 
  },
  title: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  author: { type: String, required: true },
  description: { type: String }, 
  imageUrl: { type: String },   
  bodyContent: { type: String }, 
  views: { type: Number, default: 0 }
}, { timestamps: true });

contentSchema.index({ type: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model('Content', contentSchema);