const express = require('express');
const router = express.Router();
const { dbGet, dbRun } = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET restaurant info
router.get('/', async (req, res) => {
  try {
    const info = await dbGet('SELECT * FROM restaurant_info LIMIT 1');
    res.json(info || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurant info.' });
  }
});

// PUT update restaurant info (Admin only)
router.put('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, description, address, phone, email, opening_hours } = req.body;

    const existing = await dbGet('SELECT * FROM restaurant_info LIMIT 1');
    if (!existing) {
      await dbRun(
        'INSERT INTO restaurant_info (name, description, address, phone, email, opening_hours) VALUES (?, ?, ?, ?, ?, ?)',
        [name, description, address, phone, email, opening_hours]
      );
    } else {
      await dbRun(
        'UPDATE restaurant_info SET name = ?, description = ?, address = ?, phone = ?, email = ?, opening_hours = ? WHERE id = ?',
        [
          name || existing.name,
          description || existing.description,
          address || existing.address,
          phone || existing.phone,
          email || existing.email,
          opening_hours || existing.opening_hours,
          existing.id
        ]
      );
    }

    const updated = await dbGet('SELECT * FROM restaurant_info LIMIT 1');
    const { setDocument } = require('../firebase');
    setDocument('restaurant_info', 'info', updated);
    res.json({ message: 'Restaurant details updated successfully.', info: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update restaurant info.' });
  }
});

module.exports = router;
