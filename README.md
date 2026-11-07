# Invmage — Material 3 Inventory Management App with PostgreSQL

A responsive, production-grade inventory management web application built strictly according to the **[Material Design 3 (M3)](https://m3.material.io/)** specifications, powered by a **PostgreSQL** storage engine and featuring complete **Item Group Management**, catalog CRUD, stock movement tracking, and supplier directory.

---

## 🚀 Key Features

### 🗂️ Item Group Management
- **Catalog Classification**:
  - Organize products into dedicated **Item Groups** (e.g., Electronics, Accessories, Office Supplies, Components, Packaging).
  - Each item group includes a display name, unique prefix code (e.g., `ELEC`, `ACCS`), description, and Material 3 accent color theme.
- **Aggregated Analytics**:
  - Live calculations of total products classified, total stock units on hand, and aggregated retail inventory value per group.
- **Full CRUD & Safety Safeguards**:
  - Create new groups with auto-generated code suggestions and custom color swatch picker.
  - Edit group details with real-time propagation across linked products.
  - Delete safeguard warnings that calculate and inform how many products are linked before deletion.
- **Direct Filtering**:
  - One-click **"View items"** deep-links directly into the inventory catalog pre-filtered by that group.

### 🐘 PostgreSQL Data Storage & API Architecture
- **PostgreSQL Database Storage**:
  - Dedicated PostgreSQL database backend storing `item_groups`, `suppliers`, `products`, and `movements`.
  - Full relational schema (`schema.sql`) with primary keys, unique constraints, foreign keys with `ON DELETE SET NULL` / `CASCADE`, and indexes.
  - Standard PostgreSQL connection pool using `pg.Pool` via configurable `DATABASE_URL` or standard PG parameters (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).
  - Express.js REST API providing `/api/item-groups`, `/api/products`, `/api/suppliers`, `/api/movements`, and `/api/system`.
  - **Zero-Friction Fallback**: Includes a built-in in-memory PostgreSQL engine so the application boots instantly out of the box and seamlessly switches to live PostgreSQL when configured.
  - Live database connection status pill in the Top App Bar and detailed configuration controls in Settings.

### 📦 Full Catalog CRUD
- Add new products with auto-generated unique IDs, SKU validation, Item Group selection, cost & price calculations, reorder thresholds, and warehouse location codes.
- Edit existing product specifications, pricing, and stock metadata.
- Delete products with confirmation dialog and one-click snackbar **Undo** restoration.

### 🔄 Stock Movements & Audit Trail
- **Receive**: Add newly arrived stock with purchase order / supplier references.
- **Issue**: Issue inventory with safety checks preventing over-issuance past current stock levels.
- **Adjust**: Reconcile physical inventory counts against system records with automated delta calculations.
- Full movement history with chronological audit log, filters (All, Received, Issued, Adjusted), and date/user attribution.

### 🚚 Supplier Directory
- Supplier cards with contact persons, email, phone, lead times, linked product count, and total inventory value.
- Full CRUD operations with cascade safeguards when removing suppliers.

### 📊 Interactive Material 3 Dashboard
- KPI summary cards (Total Inventory Value, Total Units on Hand, Low Stock Alerts, Out of Stock).
- Quick action shortcuts (Add Product, Record Movement, Manage Item Groups).
- Urgent Low-Stock visual alert board with one-click restock dialog.
- Item group value distribution meter with direct links to manage groups.

---

## 🛠️ PostgreSQL Setup & Database Commands

### 1. Launch PostgreSQL with Docker (Recommended)
You can start a PostgreSQL 16 instance with one command:
```bash
docker compose up -d
```
This spins up PostgreSQL on port `5432` and mounts `schema.sql` automatically.

### 2. Configure Environment (`.env.local`)
Keep local configuration in the Git-ignored `.env.local` file:
```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/invmage
```

### AI chat testing with Pollinations

Pollinations offers free testing credits on eligible accounts. Create an API
key at [enter.pollinations.ai/keys](https://enter.pollinations.ai/keys), then
add it to `.env.local` (keep the key private):
```env
POLLINATIONS_API_KEY=your_pollinations_api_key
POLLINATIONS_MODEL=openai/gpt-5.4-nano
```

When `POLLINATIONS_API_KEY` is set, AI chat uses Pollinations before OpenAI or
Gemini. The model setting is optional; the default is `openai/gpt-5.4-nano`.
Restart the API server after changing `.env.local`.

### 3. Initialize Schema Directly in PostgreSQL
To apply tables and indexes directly to your PostgreSQL instance:
```bash
npm run db:init
```

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both Backend Server & Frontend (One Command)
```bash
npm run dev
```
- Frontend UI runs on: `http://localhost:5173`
- PostgreSQL API runs on: `http://localhost:3001/api`

### 3. Run Verification Tests
```bash
npm run test:postgres
npm run test:flow
```

### 4. Build for Production
```bash
npm run build
```
