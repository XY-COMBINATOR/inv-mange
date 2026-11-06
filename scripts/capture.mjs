import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';

const EDGE =
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:5173';
const OUT = '.preview';

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--force-color-profile=srgb'],
});

const errors = [];
const page = await browser.newPage();
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

async function shot(name, { width = 1440, height = 1000, fullPage = false } = {}) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
}

await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('invmage:theme', 'light'));
await shot('dashboard-light', { fullPage: true });

await page.evaluate(() => localStorage.setItem('invmage:theme', 'dark'));
await shot('dashboard-dark', { fullPage: true });

await page.evaluate(() => localStorage.setItem('invmage:theme', 'light'));
await page.setViewport({ width: 1440, height: 1000 });
await page.goto(`${BASE}/inventory`, { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${OUT}/inventory-light.png`, fullPage: true });

await page.goto(`${BASE}/movements`, { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${OUT}/movements.png`, fullPage: true });

await page.goto(`${BASE}/suppliers`, { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${OUT}/suppliers.png`, fullPage: true });

await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${OUT}/settings.png`, fullPage: true });

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${OUT}/dashboard-mobile.png`, fullPage: true });

await page.goto(`${BASE}/inventory`, { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${OUT}/inventory-mobile.png`, fullPage: true });

await page.goto(`${BASE}/suppliers`, { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${OUT}/suppliers-mobile.png`, fullPage: true });

// Open the add product dialog on mobile.
await page.goto(`${BASE}/inventory`, { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  [...document.querySelectorAll('button')]
    .find((button) => button.textContent.includes('Add product'))
    ?.click();
});
await new Promise((resolve) => setTimeout(resolve, 500));
await page.screenshot({ path: `${OUT}/add-product-mobile.png` });

await browser.close();
console.log(JSON.stringify({ errors }, null, 2));
