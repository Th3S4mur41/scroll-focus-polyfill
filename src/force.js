/**
 * Scroll Focus Polyfill - Force version
 *
 * This version automatically applies the polyfill with force: true,
 * which means it will always apply regardless of browser support.
 */

import { applyPolyfill } from './core.js';

// Check for additional data attributes on the script tag
function getConfigFromScriptTag() {
  const currentScript = document.currentScript;
  if (!currentScript) return { force: true };

  const config = { force: true }; // Force is always true for this variant

  if (currentScript.hasAttribute('data-debug')) {
    config.debug = currentScript.getAttribute('data-debug') !== 'false';
  }

  if (currentScript.hasAttribute('data-selectors')) {
    const selectors = currentScript.getAttribute('data-selectors');
    config.selectors = selectors.split(',').map((s) => s.trim());
  }

  return config;
}

// Auto-run with force enabled
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const config = getConfigFromScriptTag();
    applyPolyfill(config);
  });
} else {
  const config = getConfigFromScriptTag();
  applyPolyfill(config);
}

// Also export for manual usage if needed
export { applyPolyfill };
