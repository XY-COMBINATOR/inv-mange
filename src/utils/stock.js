export const STOCK_STATUS = {
  in: {
    key: 'in',
    label: 'In stock',
    icon: 'check_circle',
    tone: 'success',
  },
  low: {
    key: 'low',
    label: 'Low stock',
    icon: 'warning',
    tone: 'warning',
  },
  out: {
    key: 'out',
    label: 'Out of stock',
    icon: 'error',
    tone: 'error',
  },
};

export function getStockStatus(product) {
  const quantity = Number(product?.quantity) || 0;
  const reorderPoint = Number(product?.reorderPoint) || 0;
  if (quantity <= 0) return STOCK_STATUS.out;
  if (quantity <= reorderPoint) return STOCK_STATUS.low;
  return STOCK_STATUS.in;
}

/** Signed change implied by a movement, given the current stock level. */
export function movementDelta(type, quantity, currentStock) {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  if (type === 'receive') return qty;
  if (type === 'issue') return -qty;
  return qty - (Number(currentStock) || 0);
}

export const MOVEMENT_TYPE_META = {
  receive: { label: 'Received', icon: 'add_circle', tone: 'success' },
  issue: { label: 'Issued', icon: 'remove_circle', tone: 'tertiary' },
  adjust: { label: 'Adjusted', icon: 'tune', tone: 'neutral' },
};

/** Share of total inventory value grouped by category, sorted high to low. */
export function valueByCategory(products) {
  const totals = new Map();
  for (const product of products) {
    const value = (Number(product.price) || 0) * (Number(product.quantity) || 0);
    totals.set(product.category, (totals.get(product.category) || 0) + value);
  }
  const rows = [...totals.entries()]
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return rows.map((row) => ({
    ...row,
    share: total > 0 ? row.value / total : 0,
  }));
}
