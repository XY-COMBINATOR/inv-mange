# Invmage — Material 3 Inventory Management App

A responsive, production-ready inventory management web application built strictly according to the **[Material Design 3 (M3)](https://m3.material.io/)** specifications, with full CRUD, stock movement tracking, supplier directory, and adaptive layouts.

---

## 🚀 Features

- **Full Catalog CRUD**:
  - Add new products with auto-generated unique IDs, SKU validation, category selection, cost & price calculations, reorder thresholds, and warehouse location codes.
  - Edit existing product specifications, pricing, and stock metadata.
  - Delete products with confirmation dialog and one-click snackbar **Undo** restoration.
- **Stock Movements & Audit Trail**:
  - **Receive**: Add newly arrived stock with purchase order / supplier references.
  - **Issue**: Issue inventory with safety checks preventing over-issuance past current stock levels.
  - **Adjust**: Reconcile physical inventory counts against system records with automated delta calculations.
  - Full movement history with chronological audit log, filters (All, Received, Issued, Adjusted), and date/user attribution.
- **Supplier Directory**:
  - Supplier cards with contact persons, email, phone, lead times, linked product count, and total inventory value.
  - Full CRUD operations with cascade safeguards when removing suppliers.
- **Interactive Dashboard**:
  - KPI summary cards (Total Inventory Value, Total Units on Hand, Low Stock Alerts, Out of Stock).
  - Quick action shortcuts (Add Product, Record Movement).
  - Urgent Low-Stock visual alert board with one-click restock dialog.
  - Category breakdown and stock health distribution visuals.
- **Material 3 Design System**:
  - **Color Roles**: Complete light and dark color schemes adhering to M3 tonal palettes (Primary, Secondary, Tertiary, Surface Containers, Outline, Error, and State Layers).
  - **Adaptive Layout**: Side Navigation Rail for desktop and tablet screens; bottom Navigation Bar for mobile devices.
  - **Component Hierarchy**: Fully decoupled, reusable UI primitives (Buttons, TextFields, SelectFields, SegmentedButtons, Dialogs, Cards, Chips, Menus, Snackbars, and SVGs for Material Symbols).
  - **Typography & Motion**: Uses `@fontsource-variable/roboto` with M3 type scales (Display, Headline, Title, Body, Label) and standard M3 easing curves (`cubic-bezier(0.2, 0, 0, 1)`).
- **Offline Persistence**:
  - LocalStorage persistence (`invmage:data:v1`) pre-seeded with catalog items, movement history, and suppliers.
  - Reset to demo data or export JSON backup from the Settings view.

---

## 🛠️ Project Structure

```text
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx        # Responsive container with skip-to-content
│   │   ├── TopAppBar.jsx       # Dynamic title, theme toggle & notifications
│   │   ├── NavigationRail.jsx  # Desktop M3 navigation rail
│   │   ├── BottomNav.jsx       # Mobile 5-tab navigation bar
│   │   └── layout.css
│   └── ui/
│       ├── Button.jsx          # Filled, tonal, outlined, text, danger variants
│       ├── IconButton.jsx      # Standard & tonal icon buttons with tooltips
│       ├── TextField.jsx       # Outlined floating label input with error states
│       ├── SelectField.jsx     # Outlined floating label select
│       ├── SegmentedButton.jsx # M3 single-select segmented buttons
│       ├── Dialog.jsx          # Focus-trapped modal with accessible dialog ARIA
│       ├── Card.jsx            # Outlined & elevated card containers
│       ├── Chip.jsx            # Filter & assist chips
│       ├── StockBadge.jsx      # In-stock, Low-stock, Out-of-stock indicators
│       ├── Menu.jsx            # Contextual dropdown menu with keyboard support
│       ├── Snackbar.jsx        # Floating snackbar with auto-dismiss & action
│       ├── SearchField.jsx     # Outlined search bar with clear button
│       ├── Avatar.jsx          # Tonal initials avatar
│       ├── EmptyState.jsx      # M3 empty states with iconography
│       ├── Icon.jsx            # Offline Material Symbols SVG renderer
│       └── ui.css
├── features/
│   ├── dashboard/              # Dashboard overview, KPIs, and low-stock monitor
│   ├── inventory/              # Product catalog table, filters, Add/Edit/Delete dialogs
│   ├── movements/              # Chronological movement audit log & filtering
│   ├── suppliers/              # Supplier directory cards & management dialogs
│   └── settings/               # Light/Dark/System theme selector, data reset & export
├── store/
│   ├── StoreContext.jsx        # Core state reducer & action creators
│   ├── ThemeContext.jsx        # Theme provider (light / dark / system)
│   └── ToastContext.jsx        # Snackbar toast dispatcher
├── styles/
│   ├── tokens.css              # Material 3 design tokens (colors, elevation, shape)
│   ├── base.css                # Typography & resets
│   └── forms.css               # Form grids & shared input styles
└── utils/
    ├── format.js               # Currency (INR ₹) & date formatting helpers
    └── stock.js                # Stock thresholds and status helpers
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```

### 4. Run Automated Flow Tests
```bash
npm run test:flow
```
Tests end-to-end CRUD, stock movements, validation, filters, deletion undo, supplier management, and theme transitions using Puppeteer.

### 5. Generate Visual Screenshots
```bash
npm run test:capture
```
Generates full-resolution desktop and mobile viewport screenshots for both light and dark modes in `.preview/`.

