import puppeteer from 'puppeteer-core';

const EDGE =
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:5173';

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--force-color-profile=srgb'],
});

const errors = [];
const logs = [];
const page = await browser.newPage();
page.setDefaultTimeout(5000);
await page.setViewport({ width: 1440, height: 1000 });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

const assert = (condition, message) => {
  logs.push(`${condition ? 'PASS' : 'FAIL'} · ${message}`);
  if (!condition) throw new Error(`Assertion failed: ${message}`);
};

const bodyText = () => page.evaluate(() => document.body.innerText);
const mainText = () => page.evaluate(() => document.querySelector('main')?.innerText || '');

const waitForText = (text) =>
  page.waitForFunction(
    (value) => document.body.innerText.includes(value),
    { timeout: 5000 },
    text,
  );

const clickByText = async (text, selector = 'button') => {
  const clicked = await page.evaluate(
    ({ text, selector }) => {
      const element = [...document.querySelectorAll(selector)].find((node) =>
        node.textContent.trim().includes(text),
      );
      if (!element) return false;
      element.click();
      return true;
    },
    { text, selector },
  );
  if (!clicked) throw new Error(`Could not click ${selector} with text ${text}`);
};

const clickByLabel = async (label, selector = 'button') => {
  const clicked = await page.evaluate(
    ({ label, selector }) => {
      const element = document.querySelector(
        `${selector}[aria-label="${label}"]`,
      );
      if (!element) return false;
      element.click();
      return true;
    },
    { label, selector },
  );
  if (!clicked) throw new Error(`Could not find ${selector}[aria-label="${label}"]`);
};

const fillByLabel = async (labelText, value) => {
  const result = await page.evaluate(
    ({ labelText, value }) => {
      const label = [...document.querySelectorAll('.md-dialog label')].find(
        (node) => node.textContent.includes(labelText),
      );
      if (!label) return 'label-missing';
      const input = document.getElementById(label.htmlFor);
      if (!input) return 'input-missing';
      const proto =
        input.tagName === 'SELECT'
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return 'ok';
    },
    { labelText, value },
  );
  if (result !== 'ok') throw new Error(`Could not fill ${labelText}: ${result}`);
};

await page.goto(`${BASE}/inventory`, { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  localStorage.removeItem('invmage:data:v1');
  localStorage.setItem('invmage:theme', 'light');
});
await page.reload({ waitUntil: 'networkidle0' });
await waitForText('Inventory');

// 1. Add a product
await page.evaluate(() => {
  [...document.querySelectorAll('.page-actions button')]
    .find((button) => button.textContent.includes('Add product'))
    .click();
});
await waitForText('Create a catalog item');
await page.screenshot({ path: '.preview/dialog-add-product.png' });

await fillByLabel('Product name', 'Test Studio Mic');
await fillByLabel('SKU', 'TST-MIC-99');
await fillByLabel('Location', 'Z-09');
await fillByLabel('Category', 'Electronics');
await fillByLabel('Supplier', 'sup-01');
await fillByLabel('Selling price', '4999');
await fillByLabel('Unit cost', '2600');
await fillByLabel('Reorder point', '6');
await fillByLabel('Opening stock', '12');
await clickByText('Add product', '.md-dialog__actions button');
await page.waitForFunction(() => !document.querySelector('.md-dialog'));
await waitForText('Test Studio Mic');
assert((await bodyText()).includes('Test Studio Mic'), 'product added to inventory');
assert((await bodyText()).includes('TST-MIC-99'), 'new SKU appears in catalog');

// 2. Restock the new product
await clickByLabel('Record stock for Test Studio Mic');
await waitForText('Record stock movement');
await fillByLabel('Quantity received', '8');
await waitForText('After movement');
await page.screenshot({ path: '.preview/dialog-stock-movement.png' });
await clickByText('Record movement', '.md-dialog__actions button');
await page.waitForFunction(() => !document.querySelector('.md-dialog'));
await page.waitForSelector('.md-snackbar');
const restockToast = await page.$eval('.md-snackbar', (element) =>
  element.innerText,
);
assert(
  restockToast.includes('Received 8 units'),
  'snackbar confirms the restock',
);
const restockedQuantity = await page.evaluate(() => {
  const row = [...document.querySelectorAll('tbody tr')].find((item) =>
    item.innerText.includes('Test Studio Mic'),
  );
  return row?.querySelector('.stock-cell__qty')?.textContent;
});
assert(restockedQuantity === '20', 'restock updated quantity to 20');

// 3. Issue too much stock shows validation
await page.evaluate(() => {
  [...document.querySelectorAll('.page-actions button')]
    .find((button) => button.textContent.includes('Record stock'))
    .click();
});
await waitForText('Record stock movement');
await fillByLabel('Product', await page.evaluate(() => {
  const label = [...document.querySelectorAll('.md-dialog label')].find((node) =>
    node.textContent.includes('Product'),
  );
  const select = document.getElementById(label.htmlFor);
  return [...select.options].find((option) => option.textContent.includes('Test Studio Mic')).value;
}));
await fillByLabel('Quantity received', '999');
await clickByText('Issue', '.md-segmented__item');
await fillByLabel('Quantity issued', '999');
await clickByText('Record movement', '.md-dialog__actions button');
await page.waitForFunction(() => document.body.innerText.includes('units are available'));
assert((await bodyText()).includes('Only 20 units are available'), 'issue validation limits stock');
await page.screenshot({ path: '.preview/dialog-stock-error.png' });
await clickByLabel('Close dialog');
await page.waitForFunction(() => !document.querySelector('.md-dialog'));

// 4. Edit product via row menu
await clickByLabel('Actions for Test Studio Mic');
await clickByText('Edit details', '.md-menu__item');
await waitForText('Update the product details');
await fillByLabel('Selling price', '5299');
await clickByText('Save changes', '.md-dialog__actions button');
await page.waitForFunction(() => !document.querySelector('.md-dialog'));
await waitForText('₹5,299');
assert((await bodyText()).includes('₹5,299'), 'edit saved the new price');

// 5. Search and status filters
await page.type('.inventory-search input', 'Studio Mic');
await page.waitForFunction(
  () => !document.body.innerText.includes('Aurora Wireless Headphones'),
);
assert((await bodyText()).includes('Showing 1 of 17'), 'search narrows results');
await page.evaluate(() => {
  const clear = document.querySelector('.md-search__clear');
  clear?.click();
});
await clickByText('Low stock', '.status-filters .md-chip');
assert((await bodyText()).includes('Showing 5 of 17'), 'low stock filter works');
await clickByText('All', '.status-filters .md-chip');

// 6. Delete and undo
await clickByLabel('Actions for Test Studio Mic');
await clickByText('Delete product', '.md-menu__item');
await waitForText('This cannot be undone');
await page.screenshot({ path: '.preview/dialog-delete-product.png' });
await clickByText('Delete product', '.md-dialog__actions button');
await page.waitForFunction(() => !document.querySelector('.md-dialog'));
assert(!(await mainText()).includes('Test Studio Mic'), 'product removed after delete');
await waitForText('Undo');
await clickByText('Undo', '.md-snackbar__action');
await page.waitForFunction(() => document.querySelector('main')?.innerText.includes('Test Studio Mic'));
assert((await mainText()).includes('Test Studio Mic'), 'undo restored the product');

// 7. Supplier add + delete
await page.goto(`${BASE}/suppliers`, { waitUntil: 'networkidle0' });
await clickByText('Add supplier', '.page-actions button');
await waitForText('Keep contact details');
await fillByLabel('Supplier name', 'Test Vendor');
await fillByLabel('Contact person', 'Casey Doe');
await fillByLabel('Email', 'casey@test.example');
await fillByLabel('Lead time', '6');
await clickByText('Add supplier', '.md-dialog__actions button');
await page.waitForFunction(() => !document.querySelector('.md-dialog'));
await waitForText('Test Vendor');
assert((await bodyText()).includes('Test Vendor'), 'supplier added');
await clickByLabel('Actions for Test Vendor');
await clickByText('Remove supplier', '.md-menu__item');
await waitForText('Products linked to this supplier');
await clickByText('Remove supplier', '.md-dialog__actions button');
await page.waitForFunction(() => !document.querySelector('.md-dialog'));
await waitForText('Test Vendor removed');
assert(!(await mainText()).includes('Test Vendor'), 'supplier removed');

// 8. Settings theme switch
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  const labels = [...document.querySelectorAll('.theme-option')];
  labels.find((label) => label.textContent.includes('Dark')).click();
});
await page.waitForFunction(
  () => document.documentElement.dataset.theme === 'dark',
);
assert(
  (await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark',
  'dark theme applied',
);
await page.screenshot({ path: '.preview/settings-dark.png' });

// 9. 390px add product dialog, select labels not overlapping
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.evaluate(() => {
  localStorage.setItem('invmage:theme', 'light');
});
await page.goto(`${BASE}/inventory`, { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  [...document.querySelectorAll('button')]
    .find((button) => button.textContent.includes('Add product'))
    .click();
});
await waitForText('Create a catalog item');
await fillByLabel('Product name', 'Mobile layout probe');
await page.screenshot({ path: '.preview/dialog-add-mobile-fixed.png' });
await clickByLabel('Close dialog');

await page.goto(`${BASE}/movements`, { waitUntil: 'networkidle0' });
await page.screenshot({ path: '.preview/movements-mobile.png', fullPage: true });

await browser.close();
console.log(JSON.stringify({ errors, logs }, null, 2));
