const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Helper to attach items to orders
const attachOrderItems = async (orders) => {
  if (!orders || orders.length === 0) return [];
  const result = [];
  for (const order of orders) {
    const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    result.push({ ...order, items });
  }
  return result;
};

// POST place new order
router.post('/', async (req, res) => {
  try {
    const { items, customer_name, customer_email, delivery_address, phone, payment_method, notes, user_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    if (!customer_name || !delivery_address || !phone) {
      return res.status(400).json({ error: 'Customer name, delivery address, and phone are required.' });
    }

    // Calculate total amount
    let total_amount = 0;
    for (const item of items) {
      const food = await dbGet('SELECT * FROM foods WHERE id = ?', [item.food_id]);
      if (food) {
        total_amount += food.price * item.quantity;
      } else {
        total_amount += (item.price || 0) * item.quantity;
      }
    }

    const order_number = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const userIdVal = user_id || (req.user ? req.user.id : null);

    const orderResult = await dbRun(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_email, total_amount, status, delivery_address, phone, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number,
        userIdVal,
        customer_name,
        customer_email || '',
        total_amount,
        'Pending',
        delivery_address,
        phone,
        payment_method || 'Cash on Delivery',
        notes || ''
      ]
    );

    const orderId = orderResult.id;

    for (const item of items) {
      const food = await dbGet('SELECT name FROM foods WHERE id = ?', [item.food_id]);
      const foodName = food ? food.name : item.food_name || 'Food Item';
      const itemPrice = item.price || (food ? food.price : 0);

      await dbRun(
        `INSERT INTO order_items (order_id, food_id, food_name, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.food_id, foodName, item.quantity, itemPrice]
      );
    }

    const createdOrder = await dbGet('SELECT * FROM orders WHERE id = ?', [orderId]);
    const orderItems = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    const { setDocument } = require('../firebase');
    setDocument('orders', orderId, { ...createdOrder, items: orderItems });

    res.status(201).json({
      message: 'Order placed successfully!',
      order: { ...createdOrder, items: orderItems }
    });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

// GET customer's orders
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const orders = await dbAll('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    const ordersWithItems = await attachOrderItems(orders);
    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer orders.' });
  }
});

// GET all orders (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM orders';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY id DESC';

    const orders = await dbAll(query, params);
    const ordersWithItems = await attachOrderItems(orders);
    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// GET single order details
router.get('/:id', async (req, res) => {
  try {
    const order = await dbGet('SELECT * FROM orders WHERE id = ? OR order_number = ?', [req.params.id, req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details.' });
  }
});

// PATCH update order status (Admin only)
router.patch('/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await dbGet('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    await dbRun('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    const updated = await dbGet('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [updated.id]);

    const { setDocument } = require('../firebase');
    setDocument('orders', updated.id, { ...updated, items });

    res.json({ message: 'Order status updated successfully.', order: { ...updated, items } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

module.exports = router;
