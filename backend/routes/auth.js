const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('../db');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');

// Customer Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, password_hash, phone.trim(), 'customer']
    );

    const newUser = await dbGet('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [result.id]);
    try {
      const { setDocument } = require('../firebase');
      setDocument('users', newUser.id, newUser);
    } catch (fsErr) {
      console.warn('Firebase Firestore sync warning during register:', fsErr.message);
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      user: newUser,
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration. Please try again later.' });
  }
});

// Helper to find user by email (case-insensitive)
async function findUserByEmail(emailInput) {
  if (!emailInput || typeof emailInput !== 'string') return null;
  const cleanEmail = emailInput.toLowerCase().trim();

  // Direct case-insensitive lookup
  let user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
  if (user) return user;

  // Domain variant fallback for legacy entries: @smartdin.com <-> @smartdine.com
  let altEmail = cleanEmail;
  if (cleanEmail.endsWith('@smartdin.com')) {
    altEmail = cleanEmail.replace('@smartdin.com', '@smartdine.com');
  } else if (cleanEmail.endsWith('@smartdine.com')) {
    altEmail = cleanEmail.replace('@smartdine.com', '@smartdin.com');
  }

  if (altEmail !== cleanEmail) {
    user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [altEmail]);
    if (user) return user;
  }

  return null;
}

// Optional Guest Session Access (Browsing & Permitted Actions - No Dummy Database Accounts)
router.post('/guest-access', async (req, res) => {
  try {
    const { name, phone } = req.body || {};
    const guestName = name && name.trim() ? name.trim() : 'Guest Diner';
    const guestPhone = phone && phone.trim() ? phone.trim() : '';

    const guestPayload = {
      id: 'guest_' + Date.now(),
      name: guestName,
      email: '',
      phone: guestPhone,
      role: 'guest',
      isGuest: true
    };

    const token = jwt.sign(guestPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Guest session initialized.',
      user: guestPayload,
      token
    });
  } catch (err) {
    console.error('Guest session error:', err);
    res.status(500).json({ error: 'Failed to initialize guest session.' });
  }
});

// Customer & General User Login (Standard Email & Password Authentication)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password. Please check your credentials and try again.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Also test trimmed password in case of accidental whitespace
      let secondaryMatch = false;
      if (typeof password === 'string' && password.trim() !== password) {
        secondaryMatch = await bcrypt.compare(password.trim(), user.password_hash);
      }
      if (!secondaryMatch) {
        return res.status(401).json({ error: 'Invalid email or password. Please check your credentials and try again.' });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login. Please try again later.' });
  }
});

// Dedicated Administrator Login Endpoint
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Administrator email is required.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Administrator password is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      let secondaryMatch = false;
      if (typeof password === 'string' && password.trim() !== password) {
        secondaryMatch = await bcrypt.compare(password.trim(), user.password_hash);
      }
      if (!secondaryMatch) {
        return res.status(401).json({ error: 'Invalid administrator credentials.' });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'admin', name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Administrator login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'admin',
        created_at: user.created_at
      },
      token
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error during administrator login.' });
  }
});

// Get Current User Profile (with /me alias)
const handleGetProfile = async (req, res) => {
  try {
    if (req.user.role === 'guest') {
      return res.json({
        id: req.user.id || 'guest',
        name: req.user.name || 'Guest Diner',
        email: '',
        phone: req.user.phone || '',
        role: 'guest',
        isGuest: true
      });
    }

    const user = await dbGet('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};

router.get('/profile', verifyToken, handleGetProfile);
router.get('/me', verifyToken, handleGetProfile);

// Update Profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    await dbRun('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user.id]);
    const updated = await dbGet('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
    const { setDocument } = require('../firebase');
    setDocument('users', updated.id, updated);
    res.json({ message: 'Profile updated successfully!', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Forgot Password / Reset Password Endpoint
const handleResetPassword = async (req, res) => {
  try {
    const { email, newPassword, password } = req.body;
    const targetPassword = newPassword || password;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    if (!targetPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    if (targetPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = await findUserByEmail(email.trim());
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const newHash = await bcrypt.hash(targetPassword, 10);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);

    try {
      const { setDocument } = require('../firebase');
      const updatedUser = await dbGet('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [user.id]);
      setDocument('users', user.id, updatedUser);
    } catch (fsErr) {
      console.warn('Firebase Firestore password reset sync warning:', fsErr.message);
    }

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};

router.post('/forgot-password', handleResetPassword);
router.post('/reset-password', handleResetPassword);

module.exports = router;
