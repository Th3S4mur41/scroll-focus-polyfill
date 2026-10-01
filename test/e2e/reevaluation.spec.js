import { expect, test } from '@playwright/test';
import { applyPolyfill, loadPage } from './fixtures.js';

// force: true keeps the application logic deterministic across engines,
// independent of whether the engine natively focuses scrollable elements
const FORCE = { force: true };

test('adds tabindex only to elements that overflow', async ({ page }) => {
  await loadPage(page, {
    style: '#wide, #narrow { width: 200px; }',
    body: `
      <pre id="wide"><span class="filler" style="width: 400px"></span></pre>
      <pre id="narrow"><span class="filler" style="width: 50px"></span></pre>
    `,
  });
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#wide')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#narrow')).not.toHaveAttribute('tabindex');
});

test('adds and removes tabindex as the viewport changes size', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await loadPage(page, {
    style: '#code { width: 200px; } #inner { width: 100px; } @media (max-width: 400px) { #inner { width: 500px; } }',
    body: '<pre id="code"><span id="inner" class="filler"></span></pre>',
  });
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');
  const initialWidth = await page.locator('#code').evaluate((element) => element.clientWidth);

  await page.setViewportSize({ width: 300, height: 600 });
  await expect(page.locator('#code')).toHaveJSProperty('clientWidth', initialWidth);
  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');

  await page.setViewportSize({ width: 800, height: 600 });
  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');
});

test('detects overflow caused by a sibling while the viewport stays fixed', async ({ page }) => {
  await loadPage(page, {
    style: '#code { flex: 1 1 auto; min-width: 0; }',
    body: `
      <div class="row" style="width: 400px">
        <div id="side" style="width: 100px"></div>
        <pre id="code"><span class="filler" style="width: 250px"></span></pre>
      </div>
    `,
  });
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');

  await page.locator('#side').evaluate((el) => {
    el.style.width = '350px';
  });

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
});

test('detects overflow created by content appended to a fixed-size element', async ({ page }) => {
  await loadPage(page, {
    style: '#code { width: 200px; }',
    body: '<pre id="code"><span class="filler" style="width: 50px"></span></pre>',
  });
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');

  await page.locator('#code').evaluate((el) => {
    const span = document.createElement('span');
    span.className = 'filler';
    span.style.width = '400px';
    el.appendChild(span);
  });

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
});

test('detects overflow created by a text node edit', async ({ page }) => {
  await loadPage(page, {
    style: '#code { width: 100px; }',
    body: '<pre id="code">a</pre>',
  });
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');

  await page.locator('#code').evaluate((el) => {
    el.firstChild.data = 'x'.repeat(500);
  });

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
});

test('detects overflow created and cleared by a class change on a child', async ({ page }) => {
  await loadPage(page, {
    style: '#code { width: 200px; } #inner { width: 50px; } #inner.wide { width: 400px; }',
    body: '<pre id="code"><span id="inner" class="filler"></span></pre>',
  });
  await applyPolyfill(page, FORCE);

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');

  await page.locator('#inner').evaluate((el) => el.classList.add('wide'));
  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');

  await page.locator('#inner').evaluate((el) => el.classList.remove('wide'));
  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');
});

test('reevaluates sibling matches after an attribute change', async ({ page }) => {
  await loadPage(page, {
    style: '.scrollable { width: 200px; }',
    body: '<div id="toggle"></div><pre id="code" class="scrollable"><span class="filler" style="width: 400px"></span></pre>',
  });
  await applyPolyfill(page, { ...FORCE, selectors: ['.enabled + .scrollable'] });

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');

  await page.locator('#toggle').evaluate((element) => element.classList.add('enabled'));

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
});

test('reevaluates sibling matches after an application tabindex change', async ({ page }) => {
  await loadPage(page, {
    style: '.scrollable { width: 200px; }',
    body: '<div id="before"></div><pre id="code" class="scrollable"><span class="filler" style="width: 400px"></span></pre>',
  });
  await applyPolyfill(page, { ...FORCE, selectors: ['[tabindex] + .scrollable'] });

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');

  await page.locator('#before').evaluate((element) => element.setAttribute('tabindex', '0'));

  await expect(page.locator('#before')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');
});

test('reevaluates sibling matches after character data changes', async ({ page }) => {
  await loadPage(page, {
    style: '.scrollable { width: 200px; }',
    body: '<div id="before"></div><pre id="code" class="scrollable"><span class="filler" style="width: 400px"></span></pre>',
  });
  await page.locator('#before').evaluate((element) => element.appendChild(document.createTextNode('')));
  await applyPolyfill(page, { ...FORCE, selectors: [':empty + .scrollable'] });

  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');

  await page.locator('#before').evaluate((element) => {
    element.firstChild.data = 'not empty';
  });

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');
});

test('reevaluates sibling matches after child-list changes and releases stopped matches', async ({ page }) => {
  await loadPage(page, {
    style: '.scrollable { width: 200px; }',
    body: '<span id="before"></span><pre id="code" class="scrollable"><span class="filler" style="width: 400px"></span></pre>',
  });
  await applyPolyfill(page, { ...FORCE, selectors: ['div + .scrollable'] });

  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');

  await page.locator('#code').evaluate((element) => {
    const sibling = document.createElement('div');
    sibling.id = 'trigger';
    element.before(sibling);
  });
  await expect(page.locator('#code')).toHaveAttribute('tabindex', '0');

  await page.locator('#trigger').evaluate((element) => element.remove());
  await expect(page.locator('#code')).not.toHaveAttribute('tabindex');
});

test('applies to elements added after the polyfill ran', async ({ page }) => {
  await loadPage(page, { style: '.code { width: 200px; }' });
  await applyPolyfill(page, { ...FORCE, selectors: ['.code'] });

  await page.evaluate(() => {
    document.body.innerHTML =
      '<div class="code" id="late"><span class="filler" style="width: 400px"></span></div>';
  });

  await expect(page.locator('#late')).toHaveAttribute('tabindex', '0');
});
