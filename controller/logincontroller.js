const User = require('../model/loginmodel');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// In-memory OTP store (for demo use only; for production use Redis or DB)
const otpStore = new Map();

exports.loginUser = async (req, res) => {
  const { gmail, password, role } = req.body;
  try {
    const user = await User.findOne({ gmail, password, role }); // In production, hash compare
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Step 1: Send OTP
exports.sendOtp = async (req, res) => {
  const { gmail } = req.body;

  try {
    if (!gmail) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ gmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(gmail, otp);

    // Create transporter (use env vars in production)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jcs@jecc.ac.in',
        pass: 'gyjg bbsl gvmd mxks', // Use environment variable instead!
      },
    });

    // Send email
    await transporter.sendMail({
      from: '"AnywhereWorks" <jcs@jecc.ac.in>',
      to: gmail,
      subject: 'Your OTP for Password Reset - AnywhereWorks',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <h2 style="color: #1400FF;">AnywhereWorks - Password Reset</h2>
          <p>Hello,</p>
          <p>You requested a password reset. Your OTP is:</p>
          <h3 style="text-align: center; color: #1400FF;">${otp}</h3>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="font-size: 12px; color: #777;">© ${new Date().getFullYear()} AnywhereWorks. All rights reserved.</p>
        </div>
      `,
    });

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error });
  }
};

// Step 2: Verify OTP
exports.verifyOtp = (req, res) => {
  const { gmail, otp } = req.body;

  if (!gmail || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const normalizedEmail = gmail.toLowerCase();
  const storedOtp = otpStore.get(normalizedEmail);

  if (storedOtp && storedOtp === otp) {
    return res.status(200).json({ message: 'OTP verified' });
  } else {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
};


// Step 3: Reset Password


exports.resetPassword = async (req, res) => {
  try {
    const { gmail, newPassword } = req.body;

    if (!gmail || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const trimmedEmail = gmail.toLowerCase().trim();
    const user = await User.findOne({ gmail: trimmedEmail });

    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    // ⚠️ Plain text (for testing only, not for production)
    user.password = newPassword.trim();
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.status(500).json({ message: 'Server error while resetting password' });
  }
};
