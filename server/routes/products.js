import { Router } from 'express';
import { query } from '../db.js';
import { toProduct } from '../utils.js';

const router = Router();

// GET all products with group and supplier info
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.*,
        g.name AS group_name,
        g.code AS group_code,
        g.color AS group_color,
        s.name AS supplier_name
      FROM products p
      LEFT JOIN item_groups g ON p.group_id = g.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.updated_at DESC;
    `;
    const result = await query(sql);
    res.json(result.rows.map(toProduct));
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      sku,
      groupId,
      category,
      supplierId,
      price,
      cost,
      quantity,
      reorderPoint,
      location,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (!sku || !sku.trim()) {
      return res.status(400).json({ error: 'SKU is required' });
    }

    const cleanSku = sku.trim().toUpperCase();
    const cleanName = name.trim();

    // Check SKU uniqueness
    const dup = await query('SELECT id FROM products WHERE UPPER(sku) = $1', [cleanSku]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'That SKU is already in use' });
    }

    // Determine category name from group if available
    let cat = category?.trim() || 'General';
    let resolvedGroupId = groupId || null;
    if (resolvedGroupId) {
      const grp = await query('SELECT name FROM item_groups WHERE id = $1', [resolvedGroupId]);
      if (grp.rows[0]) {
        cat = grp.rows[0].name;
      }
    } else if (cat) {
      // Find matching item group if exists
      const grp = await query('SELECT id FROM item_groups WHERE LOWER(name) = LOWER($1)', [cat]);
      if (grp.rows[0]) {
        resolvedGroupId = grp.rows[0].id;
      }
    }

    const id = `prd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const sql = `
      INSERT INTO products (
        id, name, sku, group_id, category, supplier_id,
        price, cost, quantity, reorder_point, location,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *;
    `;
    const result = await query(sql, [
      id,
      cleanName,
      cleanSku,
      resolvedGroupId,
      cat,
      supplierId || null,
      Number(price) || 0,
      Number(cost) || 0,
      Math.max(0, Math.floor(Number(quantity) || 0)),
      Math.max(0, Math.floor(Number(reorderPoint) || 0)),
      location?.trim() || '',
    ]);

    // Fetch joined
    const joined = await query(`
      SELECT p.*, g.name AS group_name, g.code AS group_code, g.color AS group_color, s.name AS supplier_name
      FROM products p
      LEFT JOIN item_groups g ON p.group_id = g.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1
    `, [id]);

    res.status(201).json(toProduct(joined.rows[0]));
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      groupId,
      category,
      supplierId,
      price,
      cost,
      reorderPoint,
      location,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (!sku || !sku.trim()) {
      return res.status(400).json({ error: 'SKU is required' });
    }

    const cleanSku = sku.trim().toUpperCase();
    const cleanName = name.trim();

    // Check duplicate SKU
    const dup = await query('SELECT id FROM products WHERE UPPER(sku) = $1 AND id != $2', [cleanSku, id]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'That SKU is already in use by another product' });
    }

    let cat = category?.trim() || 'General';
    let resolvedGroupId = groupId || null;
    if (resolvedGroupId) {
      const grp = await query('SELECT name FROM item_groups WHERE id = $1', [resolvedGroupId]);
      if (grp.rows[0]) {
        cat = grp.rows[0].name;
      }
    } else if (cat) {
      const grp = await query('SELECT id FROM item_groups WHERE LOWER(name) = LOWER($1)', [cat]);
      if (grp.rows[0]) {
        resolvedGroupId = grp.rows[0].id;
      }
    }

    const sql = `
      UPDATE products
      SET name = $1, sku = $2, group_id = $3, category = $4, supplier_id = $5,
          price = $6, cost = $7, reorder_point = $8, location = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *;
    `;
    const result = await query(sql, [
      cleanName,
      cleanSku,
      resolvedGroupId,
      cat,
      supplierId || null,
      Number(price) || 0,
      Number(cost) || 0,
      Math.max(0, Math.floor(Number(reorderPoint) || 0)),
      location?.trim() || '',
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const joined = await query(`
      SELECT p.*, g.name AS group_name, g.code AS group_code, g.color AS group_color, s.name AS supplier_name
      FROM products p
      LEFT JOIN item_groups g ON p.group_id = g.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1
    `, [id]);

    res.json(toProduct(joined.rows[0]));
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Get full product before delete for undo capability
    const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, id, product: toProduct(existing.rows[0]) });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST restore product (Undo)
router.post('/restore', async (req, res) => {
  try {
    const prod = req.body;
    if (!prod || !prod.id) {
      return res.status(400).json({ error: 'Product data required for restore' });
    }

    const sql = `
      INSERT INTO products (
        id, name, sku, group_id, category, supplier_id,
        price, cost, quantity, reorder_point, location,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
      RETURNING *;
    `;
    const result = await query(sql, [
      prod.id,
      prod.name,
      prod.sku,
      prod.groupId || null,
      prod.category,
      prod.supplierId || null,
      prod.price,
      prod.cost,
      prod.quantity,
      prod.reorderPoint,
      prod.location || '',
      prod.createdAt || new Date().toISOString(),
    ]);

    res.json(toProduct(result.rows[0]));
  } catch (err) {
    console.error('Error restoring product:', err);
    res.status(500).json({ error: 'Failed to restore product' });
  }
});

export default router;

