import { Router } from 'express';
import { query } from '../db.js';
import { toSupplier } from '../utils.js';

const router = Router();

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(result.rows.map(toSupplier));
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// POST create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contactName, email, phone, leadTime } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const id = `sup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const sql = `
      INSERT INTO suppliers (id, name, contact_name, email, phone, lead_time, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const result = await query(sql, [
      id,
      name.trim(),
      contactName?.trim() || '',
      email?.trim() || '',
      phone?.trim() || '',
      Math.max(0, Math.floor(Number(leadTime) || 0)),
    ]);

    res.status(201).json(toSupplier(result.rows[0]));
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactName, email, phone, leadTime } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const sql = `
      UPDATE suppliers
      SET name = $1, contact_name = $2, email = $3, phone = $4, lead_time = $5
      WHERE id = $6
      RETURNING *;
    `;
    const result = await query(sql, [
      name.trim(),
      contactName?.trim() || '',
      email?.trim() || '',
      phone?.trim() || '',
      Math.max(0, Math.floor(Number(leadTime) || 0)),
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(toSupplier(result.rows[0]));
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE products SET supplier_id = NULL WHERE supplier_id = $1', [id]);
    const result = await query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;

