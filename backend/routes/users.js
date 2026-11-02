const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbAll, dbGet, dbRun } = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { setDocument, deleteDocument } = require('../firebase');

// GET registered customers (Admin only)
router.get('/customers', verifyToken, isAdmin, async (req, res) => {
  try {
    const customers = await dbAll(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
             COUNT(o.id) as total_orders,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
    res.json(customers);
  } catch (err) {
    console.error('Fetch customers error:', err);
    res.status(500).json({ error: 'Failed to fetch registered customers.' });
  }
});

// POST create new customer (Admin only)
router.post('/customers', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await dbGet('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const customerPassword = password && password.trim().length >= 6 ? password.trim() : 'Customer@123';
    const passwordHash = await bcrypt.hash(customerPassword, 10);

    const result = await dbRun(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : '', 'customer']
    );

    const newCustomer = await dbGet('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [result.id]);

    try {
      setDocument('users', newCustomer.id, newCustomer);
    } catch (fsErr) {
      console.warn('Firestore customer sync warning:', fsErr.message);
    }

    res.status(201).json({
      message: 'Customer registered successfully!',
      customer: { ...newCustomer, total_orders: 0, total_spent: 0 }
    });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: 'Failed to create customer account.' });
  }
});

// PUT update customer (Admin only)
router.put('/customers/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const existing = await dbGet("SELECT * FROM users WHERE id = ? AND role = 'customer'", [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const updatedName = name && name.trim() ? name.trim() : existing.name;
    const updatedEmail = email && email.trim() ? email.toLowerCase().trim() : existing.email;
    const updatedPhone = phone !== undefined ? phone.trim() : existing.phone;

    // Check if new email conflicts with another user
    if (updatedEmail !== existing.email) {
      const emailConflict = await dbGet('SELECT * FROM users WHERE email = ? AND id != ?', [updatedEmail, id]);
      if (emailConflict) {
        return res.status(400).json({ error: 'Email is already taken by another account.' });
      }
    }

    await dbRun(
      'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
      [updatedName, updatedEmail, updatedPhone, id]
    );

    const updatedCustomer = await dbGet('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [id]);

    try {
      setDocument('users', updatedCustomer.id, updatedCustomer);
    } catch (fsErr) {
      console.warn('Firestore update sync warning:', fsErr.message);
    }

    res.json({ message: 'Customer updated successfully.', customer: updatedCustomer });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer.' });
  }
});

// DELETE customer (Admin only)
router.delete('/customers/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await dbGet("SELECT * FROM users WHERE id = ? AND role = 'customer'", [id]);
    if (!user) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Unlink orders without deleting order history
    await dbRun('UPDATE orders SET user_id = NULL WHERE user_id = ?', [id]);
    await dbRun('DELETE FROM users WHERE id = ?', [id]);

    try {
      deleteDocument('users', id);
    } catch (fsErr) {
      console.warn('Firestore delete sync warning:', fsErr.message);
    }

    res.json({ message: 'Customer deleted successfully.', id: Number(id) });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Failed to delete customer.' });
  }
});

// GET Dashboard Statistics (Admin only)
router.get('/dashboard-stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalCustomers = await dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const totalFoods = await dbGet("SELECT COUNT(*) as count FROM foods");
    const totalCategories = await dbGet("SELECT COUNT(*) as count FROM categories");
    const totalOrders = await dbGet("SELECT COUNT(*) as count FROM orders");
    const pendingOrders = await dbGet("SELECT COUNT(*) as count FROM orders WHERE LOWER(status) = 'pending'");
    const availableFoods = await dbGet("SELECT COUNT(*) as count FROM foods WHERE is_available = 1");
    const unavailableFoods = await dbGet("SELECT COUNT(*) as count FROM foods WHERE is_available = 0");
    const totalRevenue = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as sum FROM orders WHERE status != 'Cancelled'");
    const activeOrderingCustomers = await dbGet("SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE user_id IS NOT NULL");
    
    // Table Bookings Metrics
    const totalBookings = await dbGet("SELECT COUNT(*) as count FROM table_bookings");
    const pendingBookings = await dbGet("SELECT COUNT(*) as count FROM table_bookings WHERE LOWER(status) = 'pending'");
    const confirmedBookings = await dbGet("SELECT COUNT(*) as count FROM table_bookings WHERE LOWER(status) = 'confirmed'");
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = await dbGet("SELECT COUNT(*) as count FROM table_bookings WHERE booking_date = ?", [todayStr]);

    const recentOrders = await dbAll(`
      SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      ORDER BY o.id DESC
      LIMIT 6
    `);

    const recentBookings = await dbAll(`
      SELECT * FROM table_bookings
      ORDER BY id DESC
      LIMIT 6
    `);

    res.json({
      totalCustomers: totalCustomers ? totalCustomers.count : 0,
      activeOrderingCustomers: activeOrderingCustomers ? activeOrderingCustomers.count : 0,
      totalFoods: totalFoods ? totalFoods.count : 0,
      totalCategories: totalCategories ? totalCategories.count : 0,
      totalOrders: totalOrders ? totalOrders.count : 0,
      pendingOrders: pendingOrders ? pendingOrders.count : 0,
      totalBookings: totalBookings ? totalBookings.count : 0,
      pendingBookings: pendingBookings ? pendingBookings.count : 0,
      confirmedBookings: confirmedBookings ? confirmedBookings.count : 0,
      todayBookings: todayBookings ? todayBookings.count : 0,
      availableFoods: availableFoods ? availableFoods.count : 0,
      unavailableFoods: unavailableFoods ? unavailableFoods.count : 0,
      totalRevenue: totalRevenue ? totalRevenue.sum : 0,
      recentOrders,
      recentBookings
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
});

module.exports = router;
