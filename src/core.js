/**
 * Scroll Focus Polyfill - Core Module
 *
 * A tiny polyfill for browsers that cannot focus a scrollable element.
 * This notably affects keyboard accessibility of horizontally scrollable
 * elements like <pre> blocks in some environments.
 */

// Default options
const defaultOptions = {
  debug: false,
  force: false,
  selectors: ['pre'],
};

let currentOptions = { ...defaultOptions };

// Marks elements whose tabindex was added by this polyfill, so it can be safely removed
const MARKER = 'data-scroll-focus-polyfill';

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
export function applyPolyfill(options = {}) {
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

  // Add tabindex when an element overflows, remove it again when it no longer does.
  // Only attributes added by this polyfill (flagged with MARKER) are ever removed.
  const makeScrollableFocusable = (element) => {
    const hasOverflow =
      element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

    if (hasOverflow) {
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
        element.setAttribute(MARKER, '');
        log('Added tabindex to element:', element.tagName.toLowerCase());
      }
      return;
    }

    if (element.hasAttribute(MARKER)) {
      // The app may have taken over the value since we set it; in that case leave it alone
      if (element.getAttribute('tabindex') === '0') {
        element.removeAttribute('tabindex');
        log('Removed tabindex from element:', element.tagName.toLowerCase());
      }
      element.removeAttribute(MARKER);
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

  // Re-evaluate on resize: overflow can appear or disappear without any DOM mutation
  let rafId = null;
  const scheduleReevaluation = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      log('Re-evaluating elements after resize');
      applyToExistingElements();
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

  window.addEventListener('resize', scheduleReevaluation);

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(scheduleReevaluation);
    resizeObserver.observe(document.documentElement);
  }

  log('Polyfill applied and observers started');
}
