/**
 * Simple test to verify the build output
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test that all expected build files exist
const distDir = join(__dirname, '..', 'dist');
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

console.log('Testing build outputs...\n');

let allTestsPassed = true;

expectedFiles.forEach(file => {
  try {
    const filePath = join(distDir, file);
    const content = readFileSync(filePath, 'utf-8');
    
    if (content.length > 0) {
      console.log(`✓ ${file} exists and has content (${content.length} bytes)`);
      
      // Check that the file contains expected function names
      if (content.includes('applyPolyfill')) {
        console.log(`  ✓ Contains applyPolyfill function`);
      } else {
        console.log(`  ✗ Missing applyPolyfill function`);
        allTestsPassed = false;
      }
      
      // Check for polyfill logic (check for 'tabindex' and 'selectors' or 'pre')
      if (content.includes('tabindex') && (content.includes('selectors') || content.includes('pre'))) {
        console.log(`  ✓ Contains polyfill logic`);
      } else {
        console.log(`  ✗ Missing expected polyfill logic`);
        allTestsPassed = false;
      }

      // Check that the polyfill reacts to size changes at element level
      if (content.includes('ResizeObserver') && content.includes('unobserve')) {
        console.log(`  ✓ Contains element-level resize observation`);
      } else {
        console.log(`  ✗ Missing element-level resize observation`);
        allTestsPassed = false;
      }

      // Check that the polyfill reacts to viewport changes
      if (content.includes('resize') && content.includes('removeAttribute')) {
        console.log(`  ✓ Contains resize re-evaluation logic`);
      } else {
        console.log(`  ✗ Missing resize re-evaluation logic`);
        allTestsPassed = false;
      }
    } else {
      console.log(`✗ ${file} is empty`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`✗ ${file} is missing or unreadable`);
    allTestsPassed = false;
  }
  console.log('');
});

if (allTestsPassed) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
