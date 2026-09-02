const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET registered customers (Admin only)
router.get('/customers', verifyToken, isAdmin, async (req, res) => {
  try {
    const customers = await dbAll(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
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

// GET Dashboard Statistics (Admin only)
router.get('/dashboard-stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalCustomers = await dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const totalFoods = await dbGet("SELECT COUNT(*) as count FROM foods");
    const totalCategories = await dbGet("SELECT COUNT(*) as count FROM categories");
    const totalOrders = await dbGet("SELECT COUNT(*) as count FROM orders");
    const availableFoods = await dbGet("SELECT COUNT(*) as count FROM foods WHERE is_available = 1");
    const unavailableFoods = await dbGet("SELECT COUNT(*) as count FROM foods WHERE is_available = 0");
    const totalRevenue = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as sum FROM orders WHERE status != 'Cancelled'");

    const recentOrders = await dbAll(`
      SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      ORDER BY o.id DESC
      LIMIT 6
    `);

    res.json({
      totalCustomers: totalCustomers ? totalCustomers.count : 0,
      totalFoods: totalFoods ? totalFoods.count : 0,
      totalCategories: totalCategories ? totalCategories.count : 0,
      totalOrders: totalOrders ? totalOrders.count : 0,
      availableFoods: availableFoods ? availableFoods.count : 0,
      unavailableFoods: unavailableFoods ? unavailableFoods.count : 0,
      totalRevenue: totalRevenue ? totalRevenue.sum : 0,
      recentOrders
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
});

module.exports = router;
