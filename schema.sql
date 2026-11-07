-- PostgreSQL Schema for Invmage Material 3 Inventory Management App
-- Compatible with PostgreSQL 12+

-- 1. Item Groups Table
CREATE TABLE IF NOT EXISTS item_groups (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  color VARCHAR(30) DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(150) DEFAULT '',
  email VARCHAR(150) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  lead_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(250) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  group_id VARCHAR(64) REFERENCES item_groups(id) ON DELETE SET NULL,
  category VARCHAR(120) NOT NULL,
  supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE SET NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(100) DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Stock Movements Table
CREATE TABLE IF NOT EXISTS movements (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('receive', 'issue', 'adjust')),
  delta INTEGER NOT NULL,
  reason VARCHAR(150) DEFAULT '',
  note TEXT DEFAULT '',
  resulting_stock INTEGER NOT NULL,
  by_user VARCHAR(120) DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance lookup & reporting
CREATE INDEX IF NOT EXISTS idx_products_group_id ON products(group_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_movements_product_id ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at DESC);

