import { Router } from 'express';
import { query } from '../db.js';
import { toGroup } from '../utils.js';

const router = Router();

// GET all item groups with metrics
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        g.id,
        g.name,
        g.code,
        g.description,
        g.color,
        g.created_at,
        g.updated_at,
        COUNT(p.id)::int AS item_count,
        COALESCE(SUM(p.quantity), 0)::int AS total_quantity,
        COALESCE(SUM(p.price * p.quantity), 0)::float AS total_value
      FROM item_groups g
      LEFT JOIN products p ON p.group_id = g.id
      GROUP BY g.id, g.name, g.code, g.description, g.color, g.created_at, g.updated_at
      ORDER BY g.name ASC;
    `;
    const result = await query(sql);
    res.json(result.rows.map(toGroup));
  } catch (err) {
    console.error('Error fetching item groups:', err);
    res.status(500).json({ error: 'Failed to fetch item groups' });
  }
});

// GET single item group by ID
router.get('/:id', async (req, res) => {
  try {
    const sql = `
      SELECT 
        g.id,
        g.name,
        g.code,
        g.description,
        g.color,
        g.created_at,
        g.updated_at,
        COUNT(p.id)::int AS item_count,
        COALESCE(SUM(p.quantity), 0)::int AS total_quantity,
        COALESCE(SUM(p.price * p.quantity), 0)::float AS total_value
      FROM item_groups g
      LEFT JOIN products p ON p.group_id = g.id
      WHERE g.id = $1
      GROUP BY g.id, g.name, g.code, g.description, g.color, g.created_at, g.updated_at;
    `;
    const result = await query(sql, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item group not found' });
    }
    res.json(toGroup(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item group' });
  }
});

// POST create item group
router.post('/', async (req, res) => {
  try {
    const { name, code, description, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Item group name is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Item group code is required' });
    }

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    // Check uniqueness
    const dupCheck = await query(
      'SELECT id FROM item_groups WHERE LOWER(name) = LOWER($1) OR UPPER(code) = UPPER($2)',
      [cleanName, cleanCode]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({ error: 'An item group with that name or code already exists' });
    }

    const id = `grp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const sql = `
      INSERT INTO item_groups (id, name, code, description, color, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *;
    `;
    const result = await query(sql, [
      id,
      cleanName,
      cleanCode,
      description?.trim() || '',
      color || '#3b82f6',
    ]);

    res.status(201).json(toGroup(result.rows[0]));
  } catch (err) {
    console.error('Error creating item group:', err);
    res.status(500).json({ error: 'Failed to create item group' });
  }
});

// PUT update item group
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Item group name is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Item group code is required' });
    }

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    // Check duplicate name or code with different ID
    const dupCheck = await query(
      'SELECT id FROM item_groups WHERE (LOWER(name) = LOWER($1) OR UPPER(code) = UPPER($2)) AND id != $3',
      [cleanName, cleanCode, id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Another item group with that name or code already exists' });
    }

    const sql = `
      UPDATE item_groups
      SET name = $1, code = $2, description = $3, color = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *;
    `;
    const result = await query(sql, [
      cleanName,
      cleanCode,
      description?.trim() || '',
      color || '#3b82f6',
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item group not found' });
    }

    // Sync product categories if name changed
    await query('UPDATE products SET category = $1 WHERE group_id = $2', [cleanName, id]);

    res.json(toGroup(result.rows[0]));
  } catch (err) {
    console.error('Error updating item group:', err);
    res.status(500).json({ error: 'Failed to update item group' });
  }
});

// DELETE item group
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Set group_id to null for products in this group
    await query('UPDATE products SET group_id = NULL WHERE group_id = $1', [id]);
    const result = await query('DELETE FROM item_groups WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item group not found' });
    }
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting item group:', err);
    res.status(500).json({ error: 'Failed to delete item group' });
  }
});

export default router;

