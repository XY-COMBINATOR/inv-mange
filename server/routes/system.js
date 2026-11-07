import { Router } from 'express';
import { query, getStatus, seedIfEmpty } from '../db.js';

const router = Router();

// GET database status and stats
router.get('/status', async (req, res) => {
  try {
    const status = getStatus();

    const [groupsRes, productsRes, suppliersRes, movementsRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM item_groups'),
      query('SELECT COUNT(*)::int AS count, COALESCE(SUM(quantity), 0)::int AS total_units, COALESCE(SUM(price * quantity), 0)::float AS total_value FROM products'),
      query('SELECT COUNT(*)::int AS count FROM suppliers'),
      query('SELECT COUNT(*)::int AS count FROM movements'),
    ]);

    res.json({
      database: status,
      counts: {
        itemGroups: groupsRes.rows[0]?.count || 0,
        products: productsRes.rows[0]?.count || 0,
        suppliers: suppliersRes.rows[0]?.count || 0,
        movements: movementsRes.rows[0]?.count || 0,
        totalUnits: productsRes.rows[0]?.total_units || 0,
        totalValue: productsRes.rows[0]?.total_value || 0,
      },
    });
  } catch (err) {
    console.error('Error fetching system status:', err);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

// POST reset database to seed
router.post('/reset', async (req, res) => {
  try {
    await seedIfEmpty(true);
    res.json({ success: true, message: 'Database reset to default sample data' });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

export default router;

