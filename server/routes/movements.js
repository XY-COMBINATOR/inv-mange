import { Router } from 'express';
import { query } from '../db.js';
import { toMovement } from '../utils.js';

const router = Router();

// GET all movements
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        m.*,
        p.name AS product_name,
        p.sku AS product_sku
      FROM movements m
      LEFT JOIN products p ON m.product_id = p.id
      ORDER BY m.created_at DESC;
    `;
    const result = await query(sql);
    res.json(result.rows.map(toMovement));
  } catch (err) {
    console.error('Error fetching movements:', err);
    res.status(500).json({ error: 'Failed to fetch movements' });
  }
});

// POST record new stock movement
router.post('/', async (req, res) => {
  try {
    const { productId, type, quantity, reason, note, by } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    if (!['receive', 'issue', 'adjust'].includes(type)) {
      return res.status(400).json({ error: 'Valid movement type is required (receive, issue, adjust)' });
    }

    const prodRes = await query('SELECT * FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = prodRes.rows[0];
    const currentQty = Number(product.quantity);
    const qty = Math.max(0, Math.floor(Number(quantity) || 0));

    let delta = 0;
    let resultingStock = 0;

    if (type === 'receive') {
      delta = qty;
      resultingStock = currentQty + delta;
    } else if (type === 'issue') {
      if (qty > currentQty) {
        return res.status(400).json({ error: `Cannot issue ${qty} units. Only ${currentQty} units currently in stock.` });
      }
      delta = -qty;
      resultingStock = currentQty + delta;
    } else if (type === 'adjust') {
      delta = qty - currentQty;
      resultingStock = qty;
    }

    const id = `mov-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const user = by?.trim() || 'Jignesh Patel';

    // Insert movement
    const movSql = `
      INSERT INTO movements (id, product_id, type, delta, reason, note, resulting_stock, by_user, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;
    const movResult = await query(movSql, [
      id,
      productId,
      type,
      delta,
      reason || '',
      note?.trim() || '',
      resultingStock,
      user,
    ]);

    // Update product quantity and updated_at
    await query(
      'UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2',
      [resultingStock, productId]
    );

    const fullMov = await query(`
      SELECT m.*, p.name AS product_name, p.sku AS product_sku
      FROM movements m
      LEFT JOIN products p ON m.product_id = p.id
      WHERE m.id = $1
    `, [id]);

    res.status(201).json({
      movement: toMovement(fullMov.rows[0]),
      product: {
        id: product.id,
        quantity: resultingStock,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Error recording movement:', err);
    res.status(500).json({ error: 'Failed to record stock movement' });
  }
});

export default router;

