const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  gender: { type: String, default: 'Nam' },
  dob: { type: Date, default: null },
  avatar: { type: String, default: null },
  status: {
    type: String,
    enum: ['active', 'banned'],
    default: 'active'
  },
  violationCount: { 
    type: Number, 
    default: 0 
  },
  bannedUntil: { 
    type: Date, 
    default: null 
  },
  
  onboardingData: { type: Object, default: {} },
  isAdmin: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ['student', 'super_admin', 'psychologist', 'content_creator'],
    default: 'student'
  },
  pushToken: { type: String, default: null },
}, {
  timestamps: true
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);