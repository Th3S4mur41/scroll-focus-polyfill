import { expect, test } from '@playwright/test';
import { applyPolyfill, loadPage } from './fixtures.js';

const FORCE = { force: true };

const overflowingPre = {
  style: '#code { width: 200px; }',
  body: '<pre id="code"><span id="inner" class="filler" style="width: 400px"></span></pre>',
};

const clearOverflow = (page) =>
  page.locator('#inner').evaluate((el) => {
    el.style.width = '10px';
  });

test('leaves a tabindex the application took over', async ({ page }) => {
  await loadPage(page, overflowingPre);
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');

  await page.locator('#code').evaluate((el) => el.setAttribute('tabindex', '-1'));
  await clearOverflow(page);

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#code')).not.toHaveAttribute('data-scroll-focus-polyfill');
});

test('does not reclaim an element once the application owns its tabindex', async ({ page }) => {
  await loadPage(page, overflowingPre);
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');

  await page.locator('#code').evaluate((el) => el.setAttribute('tabindex', '-1'));
  await clearOverflow(page);
  await expect(page.locator('#code')).toHaveAttribute('tabindex', '-1');

  await page.locator('#inner').evaluate((el) => {
    el.style.width = '400px';
  });

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '-1');
});

test('never touches a tabindex that existed before the polyfill ran', async ({ page }) => {
  await loadPage(page, {
    style: '#code { width: 200px; }',
    body: '<pre id="code" tabindex="5"><span id="inner" class="filler" style="width: 400px"></span></pre>',
  });
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '5');

  await clearOverflow(page);

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '5');
});

test('removes only the tabindex it added when overflow disappears', async ({ page }) => {
  await loadPage(page, overflowingPre);
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#code')).toHaveAttribute('data-scroll-focus-polyfill', '');

  await clearOverflow(page);

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');
  await expect(page.locator('#code')).not.toHaveAttribute('data-scroll-focus-polyfill');
});
