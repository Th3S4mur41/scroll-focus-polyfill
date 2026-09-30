import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');

// The IIFE builds are what a browser actually loads, so the tests exercise those
export const fnBundle = readFileSync(join(distDir, 'scroll-focus-polyfill.fn.js'), 'utf-8');
export const autoBundle = readFileSync(join(distDir, 'scroll-focus-polyfill.js'), 'utf-8');

const baseStyle = `
  body { margin: 0; font-family: monospace; }
  pre, .code { margin: 0; overflow: auto; white-space: pre; }
  .row { display: flex; }
  .filler { display: inline-block; height: 10px; }
`;

export async function loadPage(page, { body = '', style = '' } = {}) {
  await page.setContent(
    `<!doctype html><html><head><style>${baseStyle}${style}</style></head><body>${body}</body></html>`
  );
}

// Applies the manual entry point and keeps the returned handle reachable for refresh() tests
export async function applyPolyfill(page, options = {}) {
  await page.addScriptTag({ content: fnBundle });
  await page.evaluate((opts) => {
    window.__polyfill = window.ScrollFocusPolyfill.applyPolyfill(opts);
  }, options);
}

export async function loadAutoBundle(page, attributes = {}) {
  await page.evaluate(
    ({ code, attrs }) => {
      const script = document.createElement('script');
      script.textContent = code;
      Object.entries(attrs).forEach(([name, value]) => script.setAttribute(name, value));
      document.head.appendChild(script);
    },
    { code: autoBundle, attrs: attributes }
  );
}
