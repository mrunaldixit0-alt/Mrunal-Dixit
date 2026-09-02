const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await dbAll('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// POST add category (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, description, image_url, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await dbGet('SELECT * FROM categories WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(400).json({ error: 'Category already exists.' });
    }

    const result = await dbRun(
      'INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, slug, description || '', image_url || '', sort_order || 0]
    );

    const newCategory = await dbGet('SELECT * FROM categories WHERE id = ?', [result.id]);
    const { setDocument } = require('../firebase');
    setDocument('categories', newCategory.id, newCategory);
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// PUT update category (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, description, image_url, sort_order } = req.body;
    const { id } = req.params;

    const category = await dbGet('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : category.slug;

    await dbRun(
      'UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, sort_order = ? WHERE id = ?',
      [
        name || category.name,
        slug,
        description !== undefined ? description : category.description,
        image_url !== undefined ? image_url : category.image_url,
        sort_order !== undefined ? sort_order : category.sort_order,
        id
      ]
    );

    const updated = await dbGet('SELECT * FROM categories WHERE id = ?', [id]);
    const { setDocument } = require('../firebase');
    setDocument('categories', updated.id, updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

// DELETE category (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM categories WHERE id = ?', [id]);
    const { deleteDocument } = require('../firebase');
    deleteDocument('categories', id);
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

module.exports = router;
