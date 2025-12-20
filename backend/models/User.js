const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: 'User' },
  googleId: { type: String },
  picture: { type: String },
  
  // Fields for OTP Authentication
  otp: { type: String },
  otpExpires: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);