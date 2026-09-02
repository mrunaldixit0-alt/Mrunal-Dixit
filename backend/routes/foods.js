const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET all foods with dynamic filters
router.get('/', async (req, res) => {
  try {
    const { search, category, tag, is_available, min_price, max_price, limit } = req.query;

    let query = `
      SELECT f.*, c.name as category_name, c.slug as category_slug
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (f.name LIKE ? OR f.description LIKE ? OR f.ingredients LIKE ? OR f.tags LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (category) {
      if (!isNaN(category)) {
        query += ` AND f.category_id = ?`;
        params.push(category);
      } else {
        query += ` AND c.slug = ?`;
        params.push(category);
      }
    }

    if (tag) {
      query += ` AND (f.tags LIKE ? OR f.dietary_info LIKE ?)`;
      params.push(`%${tag}%`, `%${tag}%`);
    }

    if (is_available !== undefined && is_available !== '') {
      query += ` AND f.is_available = ?`;
      params.push(Number(is_available));
    }

    if (min_price) {
      query += ` AND f.price >= ?`;
      params.push(Number(min_price));
    }

    if (max_price) {
      query += ` AND f.price <= ?`;
      params.push(Number(max_price));
    }

    query += ` ORDER BY f.id DESC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(Number(limit));
    }

    const foods = await dbAll(query, params);
    res.json(foods);
  } catch (err) {
    console.error('Fetch foods error:', err);
    res.status(500).json({ error: 'Failed to fetch food items.' });
  }
});

// GET food by ID
router.get('/:id', async (req, res) => {
  try {
    const food = await dbGet(
      `SELECT f.*, c.name as category_name, c.slug as category_slug
       FROM foods f
       LEFT JOIN categories c ON f.category_id = c.id
       WHERE f.id = ?`,
      [req.params.id]
    );

    if (!food) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

    res.json(food);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch food details.' });
  }
});

// POST create food (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { category_id, name, description, ingredients, price, is_available, image_url, dietary_info, tags } = req.body;

    if (!name || price === undefined || !category_id) {
      return res.status(400).json({ error: 'Name, price, and category are required.' });
    }

    const result = await dbRun(
      `INSERT INTO foods (category_id, name, description, ingredients, price, is_available, image_url, dietary_info, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        name.trim(),
        description || '',
        ingredients || '',
        Number(price),
        is_available !== undefined ? Number(is_available) : 1,
        image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
        dietary_info || '',
        tags || ''
      ]
    );

    const newFood = await dbGet('SELECT * FROM foods WHERE id = ?', [result.id]);
    const { setDocument, deleteDocument } = require('../firebase');
    setDocument('foods', newFood.id, newFood);
    res.status(201).json(newFood);
  } catch (err) {
    console.error('Create food error:', err);
    res.status(500).json({ error: 'Failed to add food item.' });
  }
});

// PUT update food (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, ingredients, price, is_available, image_url, dietary_info, tags } = req.body;

    const existing = await dbGet('SELECT * FROM foods WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

    await dbRun(
      `UPDATE foods SET
       category_id = ?, name = ?, description = ?, ingredients = ?, price = ?, is_available = ?, image_url = ?, dietary_info = ?, tags = ?
       WHERE id = ?`,
      [
        category_id !== undefined ? category_id : existing.category_id,
        name ? name.trim() : existing.name,
        description !== undefined ? description : existing.description,
        ingredients !== undefined ? ingredients : existing.ingredients,
        price !== undefined ? Number(price) : existing.price,
        is_available !== undefined ? Number(is_available) : existing.is_available,
        image_url !== undefined ? image_url : existing.image_url,
        dietary_info !== undefined ? dietary_info : existing.dietary_info,
        tags !== undefined ? tags : existing.tags,
        id
      ]
    );

    const updated = await dbGet('SELECT * FROM foods WHERE id = ?', [id]);
    const { setDocument } = require('../firebase');
    setDocument('foods', updated.id, updated);
    res.json(updated);
  } catch (err) {
    console.error('Update food error:', err);
    res.status(500).json({ error: 'Failed to update food item.' });
  }
});

// PATCH toggle availability (Admin only)
router.patch('/:id/toggle-availability', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const food = await dbGet('SELECT * FROM foods WHERE id = ?', [id]);
    if (!food) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

    const newStatus = food.is_available ? 0 : 1;
    await dbRun('UPDATE foods SET is_available = ? WHERE id = ?', [newStatus, id]);
    const updated = await dbGet('SELECT * FROM foods WHERE id = ?', [id]);
    const { setDocument } = require('../firebase');
    setDocument('foods', updated.id, updated);

    res.json({ message: 'Availability status updated.', id, is_available: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle food availability.' });
  }
});

// DELETE food item (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM foods WHERE id = ?', [id]);
    const { deleteDocument } = require('../firebase');
    deleteDocument('foods', id);
    res.json({ message: 'Food item deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete food item.' });
  }
});

module.exports = router;
