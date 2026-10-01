import { expect, test } from '@playwright/test';
import { applyPolyfill, loadAutoBundle, loadPage } from './fixtures.js';

const FORCE = { force: true };

const sidebarLayout = {
  style: '#code { flex: 1 1 auto; min-width: 0; } #side { width: 100px; }',
  body: `
    <div class="row" style="width: 400px">
      <div id="side"></div>
      <pre id="code"><span class="filler" style="width: 250px"></span></pre>
    </div>
  `,
};

test('refresh() picks up changes missed when observeResize is disabled', async ({ page }) => {
  await loadPage(page, sidebarLayout);
  await applyPolyfill(page, { ...FORCE, observeResize: false });

  await page.evaluate(() => {
    document.styleSheets[0].insertRule('#side { width: 350px !important; }');
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

test('keeps tabindex while another matching instance still owns the element', async ({ page }) => {
  await loadPage(page, {
    style: 'pre, .scrollable { width: 200px; }',
    body: '<pre id="code" class="scrollable"><span id="inner" class="filler" style="width: 400px"></span></pre>',
  });

  await applyPolyfill(page, FORCE);
  await applyPolyfill(page, { ...FORCE, selectors: ['.scrollable'] });

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
  await page.locator('#code').evaluate((element) => element.classList.remove('scrollable'));

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#code')).toHaveAttribute('data-scroll-focus-polyfill', '');

  await page.locator('#inner').evaluate((element) => {
    element.style.width = '50px';
  });

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');
  await expect(page.locator('#code')).not.toHaveAttribute('data-scroll-focus-polyfill');
});

test("does not suppress another instance's selector-affecting tabindex write", async ({ page }) => {
  await loadPage(page, {
    style: '.writer, .scrollable { width: 200px; }',
    body: `
      <pre id="writer" class="writer"><span class="filler" style="width: 50px"></span></pre>
      <pre id="target" class="scrollable"><span class="filler" style="width: 400px"></span></pre>
    `,
  });

  await applyPolyfill(page, { ...FORCE, selectors: ['[tabindex] + .scrollable'] });
  await applyPolyfill(page, { ...FORCE, selectors: ['.writer'] });

  await expect(page.locator('#target')).not.toHaveAttribute('tabindex');

  await page.locator('#writer').evaluate((element) => {
    const span = document.createElement('span');
    span.className = 'filler';
    span.style.width = '400px';
    element.appendChild(span);
  });

  await expect(page.locator('#writer')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#target')).toHaveAttribute('tabindex', '0');
});

test('shares ownership between the auto and manual entry points', async ({ page }) => {
  await loadPage(page, {
    style: 'pre { width: 200px; }',
    body: '<pre id="code" class="scrollable"><span id="inner" class="filler" style="width: 400px"></span></pre>',
  });
  await applyPolyfill(page, FORCE);
  await page.evaluate(() => window.__polyfill.refresh());

  await loadAutoBundle(page, { 'data-force': 'true', 'data-selectors': '.scrollable' });
  await page.locator('#code').evaluate((element) => element.classList.remove('scrollable'));

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#code')).toHaveAttribute('data-scroll-focus-polyfill', '');
});

test('runs focus detection when document.body is not available', async ({ page }) => {
  await loadPage(page, { body: '<div></div>' });
  await page.evaluate(() => document.body.remove());

  await applyPolyfill(page);

  expect(await page.evaluate(() => typeof window.__polyfill.refresh)).toBe('function');
});

test('validates managed selector membership once per mutation batch', async ({ page }) => {
  const targets = Array.from({ length: 12 }, (_, index) => `<div class="target" id="target-${index}"></div>`).join('');
  const changes = Array.from({ length: 8 }, (_, index) => `<div id="change-${index}"></div>`).join('');
  await loadPage(page, { body: `<div>${targets}</div><div id="changes">${changes}</div>` });
  await applyPolyfill(page, { ...FORCE, observeResize: false, selectors: ['.target'] });

  await page.evaluate(() => {
    const nativeMatches = Element.prototype.matches;
    window.__managedSelectorChecks = 0;
    Element.prototype.matches = function (selector) {
      if (this.classList.contains('target')) {
        window.__managedSelectorChecks += 1;
      }
      return nativeMatches.call(this, selector);
    };

    for (let index = 0; index < 8; index += 1) {
      document.getElementById(`change-${index}`).setAttribute('data-updated', 'true');
    }
  });

  await expect.poll(() => page.evaluate(() => window.__managedSelectorChecks)).toBe(12);
});

test('does not rescan parent scopes for polyfill-owned attributes', async ({ page }) => {
  await loadPage(page, { style: '.scrollable { width: 200px; }' });
  await applyPolyfill(page, { ...FORCE, selectors: ['.scrollable'] });

  await page.evaluate(() => {
    const nativeQuerySelectorAll = Element.prototype.querySelectorAll;
    window.__parentScopeScans = 0;
    Element.prototype.querySelectorAll = function (selector) {
      if (selector === '.scrollable' && this.hasAttribute('data-scope')) {
        window.__parentScopeScans += 1;
      }
      return nativeQuerySelectorAll.call(this, selector);
    };

    document.body.innerHTML = Array.from(
      { length: 8 },
      (_, index) =>
        `<div data-scope="${index}"><pre class="scrollable"><span class="filler" style="width: 400px"></span></pre></div>`
    ).join('');
  });

  await expect(page.locator('.scrollable')).toHaveCount(8);
  await expect(page.locator('.scrollable').first()).toHaveAttribute('tabindex', '0');
  await page.evaluate(() => new Promise(requestAnimationFrame));

  expect(await page.evaluate(() => window.__parentScopeScans)).toBe(0);
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
