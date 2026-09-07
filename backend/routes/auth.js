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

// Login (Admin or Customer)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    };

    res.json({
      message: 'Login successful!',
      user: userProfile,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get Current User Profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

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

// Forgot Password / Reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);

    res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

module.exports = router;
