const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: [true, 'Nội dung đáp án không được để trống']
  },
  score: {
    type: Number,
    required: [true, 'Trọng số điểm không được để trống'],
    min: 0
  },
  isRedFlag: {
    type: Boolean,
    default: false 
  }
}, { _id: true }); 

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Nội dung câu hỏi không được để trống']
  },
  options: [OptionSchema] 
}, { _id: true });

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tên bài test là bắt buộc'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Mã bài test là bắt buộc'],
    unique: true, 
    uppercase: true,
    index: true 
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true 
  },
  takes: {
    type: Number,
    default: 0
  },
  questions: [QuestionSchema],

  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

const Test = mongoose.model('Test', TestSchema);

module.exports = Test;