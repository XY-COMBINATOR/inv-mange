export function toGroup(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || '',
    color: row.color || '#3b82f6',
    itemCount: Number(row.item_count || row.itemCount || 0),
    totalQuantity: Number(row.total_quantity || row.totalQuantity || 0),
    totalValue: Number(row.total_value || row.totalValue || 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export function toProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    groupId: row.group_id || null,
    groupName: row.group_name || null,
    groupCode: row.group_code || null,
    groupColor: row.group_color || null,
    category: row.category,
    supplierId: row.supplier_id || null,
    supplierName: row.supplier_name || null,
    price: Number(row.price || 0),
    cost: Number(row.cost || 0),
    quantity: Number(row.quantity || 0),
    reorderPoint: Number(row.reorder_point || 0),
    location: row.location || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export function toSupplier(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name || '',
    email: row.email || '',
    phone: row.phone || '',
    leadTime: Number(row.lead_time || 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export function toMovement(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name || null,
    productSku: row.product_sku || null,
    type: row.type,
    delta: Number(row.delta),
    reason: row.reason || '',
    note: row.note || '',
    resultingStock: Number(row.resulting_stock),
    by: row.by_user || 'Admin',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

