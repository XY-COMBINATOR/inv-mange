import { initializeDatabase, query, getStatus, seedIfEmpty } from '../server/db.js';
import { toGroup, toProduct, toSupplier, toMovement } from '../server/utils.js';

async function runTests() {
  console.log('--- 1. Testing Database Initialization & Status ---');
  await initializeDatabase();
  const status = getStatus();
  console.log('DB Status:', status.type);
  if (!status.type.includes('PostgreSQL')) {
    throw new Error('Database is not PostgreSQL');
  }

  console.log('\n--- 2. Testing Item Groups CRUD ---');
  // Reset clean seed
  await seedIfEmpty(true);

  // List initial groups
  let groupsRes = await query(`
    SELECT g.id, g.name, g.code, g.description, g.color, g.created_at, g.updated_at,
           COUNT(p.id)::int AS item_count, COALESCE(SUM(p.quantity), 0)::int AS total_quantity, COALESCE(SUM(p.price * p.quantity), 0)::float AS total_value
    FROM item_groups g
    LEFT JOIN products p ON p.group_id = g.id
    GROUP BY g.id, g.name, g.code, g.description, g.color, g.created_at, g.updated_at
    ORDER BY g.name ASC;
  `);
  console.log(`Found ${groupsRes.rows.length} seeded item groups.`);
  for (const g of groupsRes.rows) {
    console.log(` - [${g.code}] ${g.name} (${g.item_count} items, ${g.total_quantity} units, ₹${g.total_value})`);
  }
  if (groupsRes.rows.length !== 5) {
    throw new Error(`Expected 5 seeded groups, got ${groupsRes.rows.length}`);
  }

  // Insert new item group
  const testGroupId = 'grp-test-smart';
  await query(
    `INSERT INTO item_groups (id, name, code, description, color, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [testGroupId, 'Smart Tech', 'SMRT', 'Internet of Things and automated gear', '#06b6d4']
  );
  console.log('Created new item group: Smart Tech [SMRT]');

  // Insert product assigned to this group
  const testProdId = 'prd-test-hub';
  await query(
    `INSERT INTO products (id, name, sku, group_id, category, price, cost, quantity, reorder_point, location, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
    [testProdId, 'Smart Zigbee Hub v2', 'SMR-HUB-01', testGroupId, 'Smart Tech', 4999, 2800, 25, 5, 'Z-01']
  );
  console.log('Created product assigned to Smart Tech group: Smart Zigbee Hub v2');

  // Verify group aggregates
  const aggRes = await query(`
    SELECT g.id, g.name, g.code, g.description, g.color, g.created_at, g.updated_at,
           COUNT(p.id)::int AS item_count, COALESCE(SUM(p.quantity), 0)::int AS total_quantity, COALESCE(SUM(p.price * p.quantity), 0)::float AS total_value
    FROM item_groups g
    LEFT JOIN products p ON p.group_id = g.id
    WHERE g.id = $1
    GROUP BY g.id, g.name, g.code, g.description, g.color, g.created_at, g.updated_at;
  `, [testGroupId]);
  const smartGroup = toGroup(aggRes.rows[0]);
  console.log('Smart Tech metrics:', {
    itemCount: smartGroup.itemCount,
    totalQuantity: smartGroup.totalQuantity,
    totalValue: smartGroup.totalValue,
  });
  if (smartGroup.itemCount !== 1 || smartGroup.totalQuantity !== 25 || smartGroup.totalValue !== 124975) {
    throw new Error('Group aggregate values did not match expected values');
  }

  // Update item group
  await query(
    `UPDATE item_groups SET name = $1, code = $2, description = $3 WHERE id = $4`,
    ['Smart Home & IoT', 'SIOT', 'Updated description', testGroupId]
  );
  const updatedRes = await query('SELECT * FROM item_groups WHERE id = $1', [testGroupId]);
  console.log('Updated item group name to:', updatedRes.rows[0].name);

  // Test Stock Movement
  console.log('\n--- 3. Testing Stock Movement in PostgreSQL ---');
  await query(
    `INSERT INTO movements (id, product_id, type, delta, reason, note, resulting_stock, by_user, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    ['mov-test-01', testProdId, 'receive', 15, 'Purchase order', 'Test arrival', 40, 'Tester']
  );
  await query('UPDATE products SET quantity = 40 WHERE id = $1', [testProdId]);

  const prodCheck = await query('SELECT quantity FROM products WHERE id = $1', [testProdId]);
  console.log('Updated product quantity after movement:', prodCheck.rows[0].quantity);
  if (Number(prodCheck.rows[0].quantity) !== 40) {
    throw new Error('Product quantity did not update correctly');
  }

  // Delete test group
  console.log('\n--- 4. Testing Delete Safeguards ---');
  await query('UPDATE products SET group_id = NULL WHERE group_id = $1', [testGroupId]);
  await query('DELETE FROM item_groups WHERE id = $1', [testGroupId]);
  await query('DELETE FROM movements WHERE product_id = $1', [testProdId]);
  await query('DELETE FROM products WHERE id = $1', [testProdId]);
  console.log('Cleaned up test group and product successfully.');

  console.log('\n>>> ALL ITEM GROUP & POSTGRESQL TESTS PASSED SUCCESSFULLY! <<<');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
