/**
 * Scroll Focus Polyfill
 *
 * A tiny polyfill for browsers that cannot focus a scrollable element.
 * This notably affects keyboard accessibility of horizontally scrollable
 * elements like <pre> blocks in some environments.
 */

(() => {
  // Default options
  const defaultOptions = {
    debug: false,
    force: false,
    selectors: ['pre'],
  };

  let currentOptions = { ...defaultOptions };

  // Logger that only logs when debug is enabled
  const log = (...args) => {
    if (currentOptions.debug) {
      console.log('[scroll-focus-polyfill]', ...args);
    }
  };

  // Check if the polyfill is needed
  function isPolyfillNeeded() {
    log('Checking if polyfill is needed...');

    // Create a fake scrollable element using pre and code
    const test = document.createElement('pre');
    test.style.width = '10px';
    test.style.height = '10px';
    test.style.overflow = 'auto';

    // Add content to make it scrollable
    const inner = document.createElement('code');
    inner.style.display = 'block';
    inner.style.width = '20px';
    test.appendChild(inner);

    // Hide from layout and accessibility
    test.style.position = 'absolute';
    test.style.left = '-9999px';
    test.setAttribute('aria-hidden', 'true');

    document.body.appendChild(test);

    // Try focusing it
    test.focus({ preventScroll: true });
    const result = document.activeElement === test;

    log(`Test element is focusable: ${result}`);

    // Cleanup
    document.body.removeChild(test);

    return !result;
  }

  // Apply the polyfill
  function applyPolyfill(options = {}) {
    // Merge options with defaults
    currentOptions = { ...defaultOptions, ...options };

    log('Applying polyfill with options:', currentOptions);

    if (!currentOptions.force && !isPolyfillNeeded()) {
      log('Polyfill not needed, skipping');
      return;
    }

    if (currentOptions.force) {
      log('Force option enabled, applying polyfill regardless');
    }

    // Make scrollable elements focusable by adding tabindex if needed
    const makeScrollableFocusable = (element) => {
      const hasOverflow =
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

      if (hasOverflow && !element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
        log('Added tabindex to element:', element.tagName.toLowerCase());
      }
    };

    // Apply to all potentially scrollable elements
    const applyToExistingElements = () => {
      log('Applying to existing elements with selectors:', currentOptions.selectors);

      currentOptions.selectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          log(`Found ${elements.length} elements matching "${selector}"`);
          elements.forEach(makeScrollableFocusable);
        } catch (e) {
          log('Error with selector', selector, e);
        }
      });
    };

    // Observe DOM changes and apply polyfill to new elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            // Check if the node itself matches any selector
            currentOptions.selectors.forEach((selector) => {
              try {
                if (node.matches?.(selector)) {
                  makeScrollableFocusable(node);
                }
              } catch (_e) {
                // Ignore invalid selectors
              }
            });

            // Check children as well
            if (node.querySelectorAll) {
              currentOptions.selectors.forEach((selector) => {
                try {
                  node.querySelectorAll(selector).forEach(makeScrollableFocusable);
                } catch (_e) {
                  // Ignore invalid selectors
                }
              });
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

    log('Polyfill applied and observer started');
  }

  // Auto-run when imported as a module
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyPolyfill());
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

  // Make applyPolyfill available globally for ES module imports
  if (typeof window !== 'undefined') {
    window.__scrollFocusPolyfillApply = applyPolyfill;
  }
})();

// ES module export - this will be available for build tools
export const applyPolyfill =
  (typeof window !== 'undefined' && window.__scrollFocusPolyfillApply) || (() => {});
