/**
 * Packaging smoke test: verifies the build emits every artifact the package
 * advertises. Runtime behaviour is covered by the Playwright suite in test/e2e.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

const expectedFiles = [
  // Default (auto-execute) version
  'scroll-focus-polyfill.js',
  'scroll-focus-polyfill.mjs',
  'scroll-focus-polyfill.umd.js',
  // Function export version
  'scroll-focus-polyfill.fn.js',
  'scroll-focus-polyfill.fn.mjs',
  'scroll-focus-polyfill.fn.umd.js',
];

let allTestsPassed = true;

const check = (label, condition) => {
  console.log(`${condition ? '✓' : '✗'} ${label}`);
  if (!condition) {
    allTestsPassed = false;
  }
};

const readIfPresent = (path) => {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
};

console.log('Testing build outputs...\n');

expectedFiles.forEach((file) => {
  const content = readIfPresent(join(distDir, file));

  check(`${file} exists and has content`, content !== null && content.length > 0);
  check(`${file}.map exists`, readIfPresent(join(distDir, `${file}.map`)) !== null);
});

console.log('');

// Every path advertised in package.json must actually be published
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const entryPaths = new Set([pkg.main, pkg.module, pkg.browser]);

Object.values(pkg.exports).forEach((entry) => {
  Object.values(entry).forEach((path) => entryPaths.add(path));
});

entryPaths.forEach((path) => {
  const content = readIfPresent(join(rootDir, path));
  check(`package.json entry ${path} resolves to a built file`, content !== null);
});

console.log('');

if (allTestsPassed) {
  console.log('✅ All packaging checks passed!');
  process.exit(0);
} else {
  console.log('❌ Some packaging checks failed');
  process.exit(1);
}
