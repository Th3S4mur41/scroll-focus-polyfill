/**
 * Scroll Focus Polyfill - Auto-execute version
 *
 * This is the default entry point that automatically applies the polyfill
 * when the script is loaded.
 */

import { applyPolyfill } from './core.js';

// Check for data attributes on the script tag for configuration
function getConfigFromScriptTag() {
  const currentScript = document.currentScript;
  if (!currentScript) return {};

  const config = {};

  if (currentScript.hasAttribute('data-debug')) {
    config.debug = currentScript.getAttribute('data-debug') !== 'false';
  }

  if (currentScript.hasAttribute('data-force')) {
    config.force = currentScript.getAttribute('data-force') !== 'false';
  }

  if (currentScript.hasAttribute('data-selectors')) {
    const selectors = currentScript.getAttribute('data-selectors');
    config.selectors = selectors.split(',').map((s) => s.trim());
  }

  return config;
}

// Auto-run when the script is loaded
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
