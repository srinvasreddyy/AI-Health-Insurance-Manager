const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: True, unique: True },
  name: String,
  googleId: String, // For OAuth
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);