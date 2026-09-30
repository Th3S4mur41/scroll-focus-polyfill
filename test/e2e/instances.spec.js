import { expect, test } from '@playwright/test';
import { applyPolyfill, loadPage } from './fixtures.js';

const FORCE = { force: true };

const sidebarLayout = {
  style: '#code { flex: 1 1 auto; min-width: 0; }',
  body: `
    <div class="row" style="width: 400px">
      <div id="side" style="width: 100px"></div>
      <pre id="code"><span class="filler" style="width: 250px"></span></pre>
    </div>
  `,
};

test('refresh() picks up changes missed when observeResize is disabled', async ({ page }) => {
  await loadPage(page, sidebarLayout);
  await applyPolyfill(page, { ...FORCE, observeResize: false });

  await page.locator('#side').evaluate((el) => {
    el.style.width = '350px';
  });

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');

  await page.evaluate(() => window.__polyfill.refresh());

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
});

test('a later invocation does not retarget an earlier one', async ({ page }) => {
  await loadPage(page, {
    style: '#code { width: 200px; } #box { width: 200px; overflow: auto; }',
    body: `
      <pre id="code"><span class="filler" style="width: 50px"></span></pre>
      <div id="box" class="box"><span class="filler" style="width: 50px"></span></div>
    `,
  });

  await applyPolyfill(page, FORCE);
  await applyPolyfill(page, { ...FORCE, selectors: ['.box'] });

  await page.evaluate(() => {
    for (const id of ['code', 'box']) {
      const span = document.createElement('span');
      span.className = 'filler';
      span.style.width = '400px';
      document.getElementById(id).appendChild(span);
    }
  });

  await expect(page.locator('#box')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
});

test('survives a node added and removed within the same batch', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await loadPage(page, { style: 'pre { width: 200px; }' });
  await applyPolyfill(page, FORCE);

  await page.evaluate(() => {
    const pre = document.createElement('pre');
    pre.innerHTML = '<span class="filler" style="width: 400px"></span>';
    document.body.appendChild(pre);
    pre.remove();
  });

  // The observer must still work afterwards
  await page.evaluate(() => {
    const pre = document.createElement('pre');
    pre.id = 'kept';
    pre.innerHTML = '<span class="filler" style="width: 400px"></span>';
    document.body.appendChild(pre);
  });

  await expect(page.locator('#kept')).toHaveAttribute('tabindex', '0');
  expect(errors).toEqual([]);
});
