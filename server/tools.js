import { z } from 'zod';
import { tool } from 'ai';
import { query } from './db.js';
import { toGroup, toProduct, toSupplier, toMovement } from './utils.js';

export const SYSTEM_PROMPT = `You are the Invmage AI Copilot — an expert inventory manager built into the Invmage Material 3 Inventory web app.
You have access to PostgreSQL database tools to perform real tasks directly in the inventory system:
- Record stock movements (receive new stock, issue out stock, or adjust counts)
- Create new products with SKU, prices, and warehouse locations
- Update product pricing
- Create item groups / product categories
- Add new suppliers
- Check stock levels, SKU lookups, and query low stock alerts
- Provide overall inventory valuation and analytics

Always be concise, professional, and helpful. When executing a task, clearly explain what changed (product name, previous vs new quantity, etc.). Currency values are in Indian Rupees (₹).`;

export const recordStockMovementTool = tool({
  description: 'Record a stock movement (receive, issue, or adjust) for an existing product by name or SKU.',
  parameters: z.object({
    productNameOrSku: z.string().describe('The name or SKU of the product to update'),
    type: z.enum(['receive', 'issue', 'adjust']).describe('Type of movement: receive, issue, or adjust'),
    quantity: z.number().int().positive().describe('The number of units to receive, issue, or target adjustment count'),
    reason: z.string().optional().describe('Reason for movement (e.g. Purchase order, Customer order, Cycle count)'),
    note: z.string().optional().describe('Additional notes or order reference'),
  }),
  execute: async ({ productNameOrSku, type, quantity, reason, note }) => {
    const term = productNameOrSku.trim();
    // Search product by exact SKU first, then by ILIKE name
    let prodRes = await query(
      'SELECT * FROM products WHERE UPPER(sku) = UPPER($1) OR LOWER(name) = LOWER($1) LIMIT 1',
      [term]
    );

    if (prodRes.rows.length === 0) {
      prodRes = await query(
        'SELECT * FROM products WHERE LOWER(name) LIKE LOWER($1) OR UPPER(sku) LIKE UPPER($1) LIMIT 1',
        [`%${term}%`]
      );
    }

    if (prodRes.rows.length === 0) {
      return {
        error: `Could not find any product matching "${productNameOrSku}". Please verify the product name or SKU.`,
      };
    }

    const product = prodRes.rows[0];
    const currentQty = Number(product.quantity);
    const qty = Math.max(0, Math.floor(quantity));

    let delta = 0;
    let resultingStock = 0;

    if (type === 'receive') {
      delta = qty;
      resultingStock = currentQty + delta;
    } else if (type === 'issue') {
      if (qty > currentQty) {
        return {
          error: `Cannot issue ${qty} units. Only ${currentQty} units of "${product.name}" are currently in stock.`,
        };
      }
      delta = -qty;
      resultingStock = currentQty + delta;
    } else if (type === 'adjust') {
      delta = qty - currentQty;
      resultingStock = qty;
    }

    const movId = `mov-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const reasonText = reason || (type === 'receive' ? 'Purchase order' : type === 'issue' ? 'Customer order' : 'Stocktake');

    // Insert movement
    await query(
      `INSERT INTO movements (id, product_id, type, delta, reason, note, resulting_stock, by_user, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'AI Copilot', NOW())`,
      [movId, product.id, type, delta, reasonText, note || 'Recorded via AI Copilot', resultingStock]
    );

    // Update product quantity
    await query('UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2', [
      resultingStock,
      product.id,
    ]);

    return {
      success: true,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      movementType: type,
      delta,
      previousStock: currentQty,
      resultingStock,
      reason: reasonText,
      message: `Successfully recorded ${type} movement of ${Math.abs(delta)} units for "${product.name}". New stock on hand is ${resultingStock} units.`,
    };
  },
});

export const createProductTool = tool({
  description: 'Create a new product catalog item in PostgreSQL with name, SKU, price, category/item group, and optional stock.',
  parameters: z.object({
    name: z.string().describe('Product name'),
    sku: z.string().describe('Unique SKU code (e.g. AUR-HP-01)'),
    categoryOrGroupName: z.string().describe('Item group or category name (e.g. Electronics, Accessories)'),
    price: z.number().min(0).describe('Selling price in ₹'),
    cost: z.number().min(0).optional().describe('Unit cost in ₹'),
    quantity: z.number().int().min(0).optional().describe('Initial quantity in stock'),
    reorderPoint: z.number().int().min(0).optional().describe('Reorder threshold'),
    location: z.string().optional().describe('Shelf / bin location code (e.g. A-01)'),
  }),
  execute: async ({ name, sku, categoryOrGroupName, price, cost = 0, quantity = 0, reorderPoint = 10, location = 'A-01' }) => {
    const cleanSku = sku.trim().toUpperCase();
    const cleanName = name.trim();

    // Check SKU duplicate
    const dup = await query('SELECT id FROM products WHERE UPPER(sku) = $1', [cleanSku]);
    if (dup.rows.length > 0) {
      return { error: `SKU "${cleanSku}" is already taken by another product.` };
    }

    // Resolve item group
    let resolvedGroupId = null;
    let resolvedCategory = categoryOrGroupName.trim();
    const grpRes = await query(
      'SELECT id, name FROM item_groups WHERE LOWER(name) = LOWER($1) OR UPPER(code) = UPPER($1) LIMIT 1',
      [resolvedCategory]
    );
    if (grpRes.rows[0]) {
      resolvedGroupId = grpRes.rows[0].id;
      resolvedCategory = grpRes.rows[0].name;
    }

    const prodId = `prd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    await query(
      `INSERT INTO products (id, name, sku, group_id, category, price, cost, quantity, reorder_point, location, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [prodId, cleanName, cleanSku, resolvedGroupId, resolvedCategory, price, cost, quantity, reorderPoint, location]
    );

    return {
      success: true,
      product: {
        id: prodId,
        name: cleanName,
        sku: cleanSku,
        category: resolvedCategory,
        price,
        cost,
        quantity,
        reorderPoint,
        location,
      },
      message: `Product "${cleanName}" (${cleanSku}) created in group "${resolvedCategory}" with selling price ₹${price} and stock ${quantity}.`,
    };
  },
});

export const updateProductPriceTool = tool({
  description: 'Update the price or cost of an existing product.',
  parameters: z.object({
    productNameOrSku: z.string().describe('Product name or SKU'),
    price: z.number().min(0).describe('New selling price in ₹'),
    cost: z.number().min(0).optional().describe('New cost in ₹'),
  }),
  execute: async ({ productNameOrSku, price, cost }) => {
    const term = productNameOrSku.trim();
    let prodRes = await query(
      'SELECT * FROM products WHERE UPPER(sku) = UPPER($1) OR LOWER(name) LIKE LOWER($2) LIMIT 1',
      [term, `%${term}%`]
    );
    if (prodRes.rows.length === 0) {
      return { error: `Could not find product matching "${productNameOrSku}".` };
    }

    const prod = prodRes.rows[0];
    const newPrice = Number(price);
    const newCost = cost !== undefined ? Number(cost) : Number(prod.cost);

    await query('UPDATE products SET price = $1, cost = $2, updated_at = NOW() WHERE id = $3', [
      newPrice,
      newCost,
      prod.id,
    ]);

    return {
      success: true,
      productName: prod.name,
      oldPrice: Number(prod.price),
      newPrice,
      oldCost: Number(prod.cost),
      newCost,
      message: `Price for "${prod.name}" updated from ₹${prod.price} to ₹${newPrice}.`,
    };
  },
});

export const createItemGroupTool = tool({
  description: 'Create a new Item Group / Category for classifying products.',
  parameters: z.object({
    name: z.string().describe('Name of the item group (e.g. Smart Wearables, Audio Gear)'),
    code: z.string().describe('Unique uppercase code (e.g. SMRT, AUD)'),
    description: z.string().optional().describe('Description of products in this group'),
    color: z.string().optional().describe('Hex color code (e.g. #3b82f6)'),
  }),
  execute: async ({ name, code, description = '', color = '#3b82f6' }) => {
    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    const dup = await query(
      'SELECT id FROM item_groups WHERE LOWER(name) = LOWER($1) OR UPPER(code) = UPPER($2)',
      [cleanName, cleanCode]
    );
    if (dup.rows.length > 0) {
      return { error: `An item group with name "${cleanName}" or code "${cleanCode}" already exists.` };
    }

    const grpId = `grp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    await query(
      `INSERT INTO item_groups (id, name, code, description, color, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [grpId, cleanName, cleanCode, description, color]
    );

    return {
      success: true,
      group: { id: grpId, name: cleanName, code: cleanCode, description, color },
      message: `Item group "${cleanName}" [${cleanCode}] created successfully.`,
    };
  },
});

export const checkStockTool = tool({
  description: 'Check stock levels, SKU, price, and location for products by search term.',
  parameters: z.object({
    query: z.string().describe('Product name, SKU, or category to look up'),
  }),
  execute: async ({ query: searchTerm }) => {
    const term = searchTerm.trim();
    const res = await query(
      `SELECT p.id, p.name, p.sku, p.category, p.price, p.quantity, p.reorder_point, p.location
       FROM products p
       WHERE LOWER(p.name) LIKE LOWER($1) OR UPPER(p.sku) LIKE UPPER($1) OR LOWER(p.category) LIKE LOWER($1)
       ORDER BY p.name ASC LIMIT 10`,
      [`%${term}%`]
    );

    return {
      count: res.rows.length,
      products: res.rows.map((r) => ({
        name: r.name,
        sku: r.sku,
        category: r.category,
        quantity: Number(r.quantity),
        reorderPoint: Number(r.reorder_point),
        price: Number(r.price),
        location: r.location,
        status: Number(r.quantity) === 0 ? 'Out of stock' : Number(r.quantity) <= Number(r.reorder_point) ? 'Low stock' : 'In stock',
      })),
    };
  },
});

export const getLowStockItemsTool = tool({
  description: 'Get all products currently at or below their reorder threshold or out of stock.',
  parameters: z.object({}),
  execute: async () => {
    const res = await query(
      `SELECT p.id, p.name, p.sku, p.category, p.quantity, p.reorder_point, p.location, p.price
       FROM products p
       WHERE p.quantity <= p.reorder_point
       ORDER BY p.quantity ASC`
    );

    return {
      totalAlerts: res.rows.length,
      items: res.rows.map((r) => ({
        name: r.name,
        sku: r.sku,
        category: r.category,
        quantity: Number(r.quantity),
        reorderPoint: Number(r.reorder_point),
        location: r.location,
        shortage: Math.max(0, Number(r.reorder_point) - Number(r.quantity)),
      })),
    };
  },
});

export const getInventoryOverviewTool = tool({
  description: 'Get comprehensive inventory statistics, valuations, and item group breakdown.',
  parameters: z.object({}),
  execute: async () => {
    const [totals, groups, alerts] = await Promise.all([
      query(`
        SELECT COUNT(*)::int AS total_products,
               COALESCE(SUM(quantity), 0)::int AS total_units,
               COALESCE(SUM(price * quantity), 0)::float AS total_value,
               COALESCE(SUM(cost * quantity), 0)::float AS total_cost
        FROM products
      `),
      query(`
        SELECT g.name, g.code, COUNT(p.id)::int AS item_count, COALESCE(SUM(p.quantity), 0)::int AS units, COALESCE(SUM(p.price * p.quantity), 0)::float AS val
        FROM item_groups g
        LEFT JOIN products p ON p.group_id = g.id
        GROUP BY g.name, g.code
        ORDER BY val DESC
      `),
      query('SELECT COUNT(*)::int AS low_count FROM products WHERE quantity <= reorder_point'),
    ]);

    return {
      totalProducts: totals.rows[0]?.total_products || 0,
      totalUnits: totals.rows[0]?.total_units || 0,
      totalValue: totals.rows[0]?.total_value || 0,
      totalCost: totals.rows[0]?.total_cost || 0,
      lowStockAlerts: alerts.rows[0]?.low_count || 0,
      groups: groups.rows,
    };
  },
});

export const createSupplierTool = tool({
  description: 'Add a new supplier / vendor to the inventory system.',
  parameters: z.object({
    name: z.string().describe('Supplier company name'),
    contactName: z.string().optional().describe('Contact person name'),
    email: z.string().optional().describe('Email address'),
    phone: z.string().optional().describe('Phone number'),
    leadTime: z.number().int().min(0).optional().describe('Lead time in days'),
  }),
  execute: async ({ name, contactName = '', email = '', phone = '', leadTime = 5 }) => {
    const supId = `sup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    await query(
      `INSERT INTO suppliers (id, name, contact_name, email, phone, lead_time, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [supId, name.trim(), contactName.trim(), email.trim(), phone.trim(), leadTime]
    );

    return {
      success: true,
      supplier: { id: supId, name: name.trim(), contactName, email, phone, leadTime },
      message: `Supplier "${name.trim()}" added with lead time of ${leadTime} days.`,
    };
  },
});

export const INVENTORY_TOOLS = {
  recordStockMovement: recordStockMovementTool,
  createProduct: createProductTool,
  updateProductPrice: updateProductPriceTool,
  createItemGroup: createItemGroupTool,
  checkStock: checkStockTool,
  getLowStockItems: getLowStockItemsTool,
  getInventoryOverview: getInventoryOverviewTool,
  createSupplier: createSupplierTool,
};

