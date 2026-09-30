import { expect, test } from '@playwright/test';
import { loadAutoBundle, loadPage } from './fixtures.js';

test('leaves a scrollable element keyboard focusable on every engine', async ({ page }) => {
  await loadPage(page, {
    style: '#code { width: 200px; }',
    body: '<pre id="code"><span class="filler" style="width: 400px"></span></pre>',
  });
  await loadAutoBundle(page);

  // Either the engine focuses scrollable elements natively or the polyfill stepped in
  const focusable = await page.evaluate(() => {
    const element = document.getElementById('code');
    element.focus();
    return document.activeElement === element;
  });

  expect(focusable).toBe(true);
});

test('reads configuration from script tag data attributes', async ({ page }) => {
  await loadPage(page, {
    style: '.code { width: 200px; overflow: auto; }',
    body: '<div class="code" id="block"><span class="filler" style="width: 400px"></span></div>',
  });
  await loadAutoBundle(page, { 'data-force': 'true', 'data-selectors': '.code' });

  await expect(page.locator('#block')).toHaveAttribute('tabindex', '0');
});

test('does not apply to elements outside the configured selectors', async ({ page }) => {
  await loadPage(page, {
    style: '#code, #other { width: 200px; overflow: auto; }',
    body: `
      <div class="code" id="code"><span class="filler" style="width: 400px"></span></div>
      <div id="other"><span class="filler" style="width: 400px"></span></div>
    `,
  });
  await loadAutoBundle(page, { 'data-force': 'true', 'data-selectors': '.code' });

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#other')).not.toHaveAttribute('tabindex');
});
