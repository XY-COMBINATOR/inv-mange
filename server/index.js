import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';
import itemGroupsRouter from './routes/itemGroups.js';
import productsRouter from './routes/products.js';
import suppliersRouter from './routes/suppliers.js';
import movementsRouter from './routes/movements.js';
import systemRouter from './routes/system.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/item-groups', itemGroupsRouter);
app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/movements', movementsRouter);
app.use('/api/system', systemRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`[Server] Invmage PostgreSQL API server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start server:', err);
    process.exit(1);
  }
}

start();

