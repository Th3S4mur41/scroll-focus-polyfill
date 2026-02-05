/**
 * Scroll Focus Polyfill
 *
 * A tiny polyfill for browsers that cannot focus a scrollable element.
 * This notably affects keyboard accessibility of horizontally scrollable
 * elements like <pre> blocks in some environments.
 */

(() => {
  // Check if the polyfill is needed
  function isPolyfillNeeded() {
    // Test if the browser can focus scrollable elements
    const testElement = document.createElement('div');
    testElement.style.cssText =
      'overflow: auto; width: 100px; height: 100px; position: absolute; left: -9999px;';
    testElement.innerHTML = '<div style="width: 200px; height: 200px;"></div>';
    document.body.appendChild(testElement);

    testElement.focus();
    const canFocus = document.activeElement === testElement;

    document.body.removeChild(testElement);

    return !canFocus;
  }

  // Apply the polyfill
  function applyPolyfill() {
    if (!isPolyfillNeeded()) {
      return;
    }

    // Make scrollable elements focusable by adding tabindex if needed
    const makeScrollableFocusable = (element) => {
      const hasOverflow =
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

      if (hasOverflow && !element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    };

    // Apply to all potentially scrollable elements
    const applyToExistingElements = () => {
      const scrollableSelectors = ['pre', '[style*="overflow"]', '.scroll', '.scrollable'];

      scrollableSelectors.forEach((selector) => {
        try {
          document.querySelectorAll(selector).forEach(makeScrollableFocusable);
        } catch (_e) {
          // Ignore invalid selectors
        }
      });
    };

    // Observe DOM changes and apply polyfill to new elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            makeScrollableFocusable(node);
            // Check children as well
            if (node.querySelectorAll) {
              node.querySelectorAll('pre, [style*="overflow"]').forEach(makeScrollableFocusable);
            }
          }
        });
      });
    });

    // Initialize
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyToExistingElements);
    } else {
      applyToExistingElements();
    }

    // Start observing
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // Auto-run when imported as a module
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPolyfill);
  } else {
    applyPolyfill();
  }

  // Export for manual usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { applyPolyfill };
  } else if (typeof define === 'function' && define.amd) {
    define([], () => ({ applyPolyfill }));
  } else if (typeof window !== 'undefined') {
    window.scrollFocusPolyfill = { applyPolyfill };
  }
})();
