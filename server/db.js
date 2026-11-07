import pg from 'pg';
import { newDb } from 'pg-mem';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool = null;
let isPgMem = false;
let dbStatus = {
  connected: false,
  type: 'Initializing',
  message: '',
  timestamp: new Date().toISOString(),
};

const SEED_ITEM_GROUPS = [
  {
    id: 'grp-electronics',
    name: 'Electronics',
    code: 'ELEC',
    description: 'Audio devices, smart peripherals, keyboards, and battery banks.',
    color: '#3b82f6',
  },
  {
    id: 'grp-accessories',
    name: 'Accessories',
    code: 'ACCS',
    description: 'Cables, ergonomic stands, protective sleeves, and adapters.',
    color: '#8b5cf6',
  },
  {
    id: 'grp-office',
    name: 'Office',
    code: 'OFFC',
    description: 'Lamps, notebooks, organizers, and everyday desk supplies.',
    color: '#10b981',
  },
  {
    id: 'grp-components',
    name: 'Components',
    code: 'CMPN',
    description: 'Microcontrollers, sensors, ICs, display modules, and headers.',
    color: '#f59e0b',
  },
  {
    id: 'grp-packaging',
    name: 'Packaging',
    code: 'PCKG',
    description: 'Cardboard mailers, honeycomb cushioning, sealing tape, and labels.',
    color: '#ec4899',
  },
];

const SEED_SUPPLIERS = [
  {
    id: 'sup-01',
    name: 'Northstar Electronics',
    contactName: 'Priya Nair',
    email: 'priya@northstar.example',
    phone: '+91 98200 11223',
    leadTime: 5,
  },
  {
    id: 'sup-02',
    name: 'Kite Accessories',
    contactName: 'Rohan Mehta',
    email: 'rohan@kiteacc.example',
    phone: '+91 98670 44551',
    leadTime: 3,
  },
  {
    id: 'sup-03',
    name: 'Studio Supply Co.',
    contactName: 'Ananya Rao',
    email: 'ananya@studiosupply.example',
    phone: '+91 90040 78612',
    leadTime: 7,
  },
  {
    id: 'sup-04',
    name: 'Silicon Partners',
    contactName: 'Dev Shah',
    email: 'dev@siliconpartners.example',
    phone: '+91 99870 22334',
    leadTime: 9,
  },
  {
    id: 'sup-05',
    name: 'Parcel & Pack',
    contactName: 'Meera Iyer',
    email: 'meera@parcelandpack.example',
    phone: '+91 98190 56789',
    leadTime: 4,
  },
];

const SEED_PRODUCTS = [
  {
    id: 'prd-001',
    name: 'Aurora Wireless Headphones',
    sku: 'AUR-HP-01',
    groupId: 'grp-electronics',
    category: 'Electronics',
    supplierId: 'sup-01',
    price: 8999,
    cost: 5200,
    quantity: 42,
    reorderPoint: 15,
    location: 'A-01',
  },
  {
    id: 'prd-002',
    name: 'Nimbus Bluetooth Speaker',
    sku: 'NIM-SP-02',
    groupId: 'grp-electronics',
    category: 'Electronics',
    supplierId: 'sup-01',
    price: 5499,
    cost: 3100,
    quantity: 8,
    reorderPoint: 12,
    location: 'A-02',
  },
  {
    id: 'prd-003',
    name: 'Pulse USB-C Cable 2 m',
    sku: 'PLS-CB-03',
    groupId: 'grp-accessories',
    category: 'Accessories',
    supplierId: 'sup-02',
    price: 799,
    cost: 220,
    quantity: 156,
    reorderPoint: 40,
    location: 'B-11',
  },
  {
    id: 'prd-004',
    name: 'Aero Laptop Stand',
    sku: 'AER-LS-04',
    groupId: 'grp-accessories',
    category: 'Accessories',
    supplierId: 'sup-02',
    price: 2499,
    cost: 1200,
    quantity: 0,
    reorderPoint: 10,
    location: 'B-12',
  },
  {
    id: 'prd-005',
    name: 'Vertex Mechanical Keyboard',
    sku: 'VTX-KB-05',
    groupId: 'grp-electronics',
    category: 'Electronics',
    supplierId: 'sup-01',
    price: 7499,
    cost: 4300,
    quantity: 23,
    reorderPoint: 10,
    location: 'A-03',
  },
  {
    id: 'prd-006',
    name: 'Halo Desk Lamp',
    sku: 'HAL-DL-06',
    groupId: 'grp-office',
    category: 'Office',
    supplierId: 'sup-03',
    price: 3299,
    cost: 1800,
    quantity: 5,
    reorderPoint: 8,
    location: 'C-04',
  },
  {
    id: 'prd-007',
    name: 'Grid Cable Organizer',
    sku: 'GRD-CO-07',
    groupId: 'grp-office',
    category: 'Office',
    supplierId: 'sup-03',
    price: 599,
    cost: 180,
    quantity: 74,
    reorderPoint: 20,
    location: 'C-05',
  },
  {
    id: 'prd-008',
    name: 'Terra Notebook A5',
    sku: 'TER-NB-08',
    groupId: 'grp-office',
    category: 'Office',
    supplierId: 'sup-03',
    price: 349,
    cost: 110,
    quantity: 210,
    reorderPoint: 50,
    location: 'C-06',
  },
  {
    id: 'prd-009',
    name: 'Flux Power Bank 20,000 mAh',
    sku: 'FLX-PB-09',
    groupId: 'grp-accessories',
    category: 'Accessories',
    supplierId: 'sup-02',
    price: 3999,
    cost: 2300,
    quantity: 17,
    reorderPoint: 15,
    location: 'B-13',
  },
  {
    id: 'prd-010',
    name: 'Orbit Wireless Mouse',
    sku: 'ORB-MS-10',
    groupId: 'grp-accessories',
    category: 'Accessories',
    supplierId: 'sup-02',
    price: 2199,
    cost: 1050,
    quantity: 3,
    reorderPoint: 12,
    location: 'B-14',
  },
  {
    id: 'prd-011',
    name: 'Zen Monitor Riser',
    sku: 'ZEN-MT-11',
    groupId: 'grp-office',
    category: 'Office',
    supplierId: 'sup-03',
    price: 4599,
    cost: 2600,
    quantity: 12,
    reorderPoint: 6,
    location: 'C-07',
  },
  {
    id: 'prd-012',
    name: 'Core NVMe SSD 1 TB',
    sku: 'COR-SD-12',
    groupId: 'grp-components',
    category: 'Components',
    supplierId: 'sup-04',
    price: 8299,
    cost: 6000,
    quantity: 9,
    reorderPoint: 10,
    location: 'D-01',
  },
  {
    id: 'prd-013',
    name: 'Link Ethernet Adapter',
    sku: 'LNK-EA-13',
    groupId: 'grp-components',
    category: 'Components',
    supplierId: 'sup-04',
    price: 1499,
    cost: 700,
    quantity: 48,
    reorderPoint: 15,
    location: 'D-02',
  },
  {
    id: 'prd-014',
    name: 'PackPro Mailer Boxes (50)',
    sku: 'PCK-MB-14',
    groupId: 'grp-packaging',
    category: 'Packaging',
    supplierId: 'sup-05',
    price: 899,
    cost: 420,
    quantity: 320,
    reorderPoint: 80,
    location: 'E-01',
  },
  {
    id: 'prd-015',
    name: 'Bubble Wrap Roll',
    sku: 'PCK-BW-15',
    groupId: 'grp-packaging',
    category: 'Packaging',
    supplierId: 'sup-05',
    price: 1199,
    cost: 600,
    quantity: 26,
    reorderPoint: 30,
    location: 'E-02',
  },
  {
    id: 'prd-016',
    name: 'Tape Dispenser',
    sku: 'PCK-TD-16',
    groupId: 'grp-packaging',
    category: 'Packaging',
    supplierId: 'sup-05',
    price: 449,
    cost: 190,
    quantity: 64,
    reorderPoint: 20,
    location: 'E-03',
  },
];

const SEED_MOVEMENTS = [
  {
    id: 'mov-01',
    productId: 'prd-001',
    type: 'receive',
    delta: 20,
    reason: 'Purchase order',
    note: 'PO #4821 · 1 carton',
    resultingStock: 42,
    by: 'Jignesh Patel',
  },
  {
    id: 'mov-02',
    productId: 'prd-002',
    type: 'issue',
    delta: -4,
    reason: 'Customer order',
    note: 'Order #IN-90812',
    resultingStock: 8,
    by: 'Jignesh Patel',
  },
  {
    id: 'mov-03',
    productId: 'prd-004',
    type: 'issue',
    delta: -10,
    reason: 'Customer order',
    note: 'Bulk dispatch #IN-90799',
    resultingStock: 0,
    by: 'Jignesh Patel',
  },
  {
    id: 'mov-04',
    productId: 'prd-007',
    type: 'adjust',
    delta: -6,
    reason: 'Cycle count',
    note: 'Damaged packaging written off',
    resultingStock: 74,
    by: 'Jignesh Patel',
  },
];

const DDL_STATEMENTS = `
  CREATE TABLE IF NOT EXISTS item_groups (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    color VARCHAR(30) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(150) DEFAULT '',
    email VARCHAR(150) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    lead_time INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(250) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    group_id VARCHAR(64),
    category VARCHAR(120) NOT NULL,
    supplier_id VARCHAR(64),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER NOT NULL DEFAULT 0,
    location VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS movements (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL,
    type VARCHAR(20) NOT NULL,
    delta INTEGER NOT NULL,
    reason VARCHAR(150) DEFAULT '',
    note TEXT DEFAULT '',
    resulting_stock INTEGER NOT NULL,
    by_user VARCHAR(120) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT NOW()
  );
`;

export async function initializeDatabase() {
  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'invmage'}`;

  let realPool = null;
  // Try real PostgreSQL connection first
  try {
    realPool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
    });

    const res = await realPool.query('SELECT NOW()');
    console.log(`[PostgreSQL] Successfully connected to live database at ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
    pool = realPool;
    isPgMem = false;
    dbStatus = {
      connected: true,
      type: 'PostgreSQL Live Server',
      target: connectionString.replace(/:[^:@]+@/, ':****@'),
      message: 'Connected to live PostgreSQL database.',
      timestamp: res.rows[0].now,
    };
  } catch (err) {
    if (realPool) {
      realPool.end().catch(() => {});
    }
    console.warn(`[PostgreSQL] Live connection failed (${err.message}). Using built-in PostgreSQL in-memory engine.`);
    const db = newDb();
    const adapter = db.adapters.createPg();
    pool = new adapter.Pool();
    isPgMem = true;
    dbStatus = {
      connected: false,
      type: 'PostgreSQL (In-Memory Engine)',
      target: connectionString.replace(/:[^:@]+@/, ':****@'),
      message: `Live PostgreSQL was unreachable (${err.message}). Falling back to built-in in-memory PostgreSQL instance. All PostgreSQL SQL queries and constraints are active.`,
      timestamp: new Date().toISOString(),
    };
  }

  // Create tables
  await pool.query(DDL_STATEMENTS);

  // Auto seed if empty
  await seedIfEmpty();

  return pool;
}

export async function seedIfEmpty(force = false) {
  if (force) {
    await pool.query('DELETE FROM movements');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM suppliers');
    await pool.query('DELETE FROM item_groups');
  }

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM item_groups');
  if (Number(rows[0]?.count) > 0 && !force) {
    return;
  }

  console.log('[PostgreSQL] Seeding initial item groups, suppliers, products, and movements...');

  // Seed Item Groups
  for (const grp of SEED_ITEM_GROUPS) {
    await pool.query(
      `INSERT INTO item_groups (id, name, code, description, color, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [grp.id, grp.name, grp.code, grp.description, grp.color]
    );
  }

  // Seed Suppliers
  for (const sup of SEED_SUPPLIERS) {
    await pool.query(
      `INSERT INTO suppliers (id, name, contact_name, email, phone, lead_time, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [sup.id, sup.name, sup.contactName, sup.email, sup.phone, sup.leadTime]
    );
  }

  // Seed Products
  for (const prod of SEED_PRODUCTS) {
    await pool.query(
      `INSERT INTO products (id, name, sku, group_id, category, supplier_id, price, cost, quantity, reorder_point, location, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        prod.id,
        prod.name,
        prod.sku,
        prod.groupId,
        prod.category,
        prod.supplierId,
        prod.price,
        prod.cost,
        prod.quantity,
        prod.reorderPoint,
        prod.location,
      ]
    );
  }

  // Seed Movements
  for (const mov of SEED_MOVEMENTS) {
    await pool.query(
      `INSERT INTO movements (id, product_id, type, delta, reason, note, resulting_stock, by_user, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        mov.id,
        mov.productId,
        mov.type,
        mov.delta,
        mov.reason,
        mov.note,
        mov.resultingStock,
        mov.by,
      ]
    );
  }

  console.log('[PostgreSQL] Initial seed complete.');
}

export async function query(sql, params) {
  if (!pool) {
    await initializeDatabase();
  }
  return pool.query(sql, params);
}

export function getStatus() {
  return {
    ...dbStatus,
    isPgMem,
  };
}

