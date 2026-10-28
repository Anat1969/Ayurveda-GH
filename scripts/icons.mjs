// מייצר את אייקוני ה-PNG מתוך icon.svg.
import fs from 'node:fs';
import { createRequire } from 'node:module';

// Playwright מותקן גלובלית בסביבת הפיתוח.
const { chromium } = createRequire(import.meta.url)('playwright');

const svg = fs.readFileSync('public/icons/icon.svg', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, maskable] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]]) {
  const inner = svg;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${inner}`);
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: true });
}
await browser.close();
