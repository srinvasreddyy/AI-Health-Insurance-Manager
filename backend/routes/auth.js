const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email Transporter (Use App Password for Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail App Password
  }
});

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { user: { id: user.id, email: user.email, name: user.name } },
    process.env.JWT_SECRET || 'secret_key_change_me',
    { expiresIn: '24h' }
  );
};

// @route   POST /api/auth/google
// @desc    Login/Register with Google
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { email, name, picture, sub } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register
      user = new User({ email, name, picture, googleId: sub });
      await user.save();
    } else if (!user.googleId) {
      // Link Google ID if user exists via OTP but hasn't used Google yet
      user.googleId = sub;
      if (!user.picture) user.picture = picture;
      await user.save();
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });

  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(400).json({ message: 'Google authentication failed' });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    let user = await User.findOne({ email });
    
    if (!user) {
      // Create temporary user record if they don't exist
      user = new User({ email, name: email.split('@')[0] });
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await transporter.sendMail({
      from: `"Insurance Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Login OTP',
      text: `Your login code is: ${otp}. It expires in 10 minutes.`
    });

    res.json({ message: 'OTP sent to email' });

  } catch (err) {
    console.error('OTP Send Error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and Login
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful use
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;