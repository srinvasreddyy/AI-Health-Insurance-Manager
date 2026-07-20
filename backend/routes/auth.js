const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email Transporter (Use App Password for Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail App Password
  }
});

// Verify email transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email transporter ready');
  }
});

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { user: { id: user._id, email: user.email, name: user.name } },
    process.env.JWT_SECRET || 'secret_key_change_me',
    { expiresIn: '24h' }
  );
};

// Helper to send email with retry logic
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      console.error(`Email send attempt ${i + 1} failed:`, err);
      if (i === maxRetries - 1) throw err;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// @route   GET /api/auth/profile
// @desc    Get current user profile (token validation)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: { id: user._id, name: user.name, email: user.email, picture: user.picture } });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/google
// @desc    Login/Register with Google
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  try {
    if (!credential) {
      return res.status(400).json({ message: 'No credential provided' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { email, name, picture, sub } = ticket.getPayload();

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

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
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, picture: user.picture } 
    });

  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(400).json({ message: 'Google authentication failed. Please try again.' });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  
  if (!email) return res.status(400).json({ message: 'Email is required' });
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

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

    // Send email with retry logic
    await sendEmailWithRetry({
      from: `"Insurance Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Login OTP - AI Health Insurance Manager',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Login Code</h2>
          <p>Your one-time password (OTP) for AI Health Insurance Manager is:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Do not share this code with anyone.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to email successfully' });

  } catch (err) {
    console.error('OTP Send Error:', err);
    
    if (err.message.includes('Email')) {
      res.status(503).json({ message: 'Email service temporarily unavailable. Please try again in a moment.' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP. Please check your email and try again.' });
    }
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and Login
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found. Please request a new OTP.' });
    }

    if (!user.otp) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    // Check OTP expiration first
    if (Date.now() > user.otpExpires) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check OTP value
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Clear OTP after successful use
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user);
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email } 
    });

  } catch (err) {
    console.error('OTP Verification Error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to email
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if last OTP request was recent (prevent spam)
    if (user.otpExpires && Date.now() < user.otpExpires - 9 * 60 * 1000) {
      return res.status(429).json({ message: 'Please wait before requesting a new OTP' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmailWithRetry({
      from: `"Insurance Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your New Login OTP - AI Health Insurance Manager',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your New Login Code</h2>
          <p>Your new one-time password (OTP) for AI Health Insurance Manager is:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'New OTP sent to email successfully' });

  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
  }
});

module.exports = router;
