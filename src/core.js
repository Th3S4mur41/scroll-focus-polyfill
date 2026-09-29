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
  observeResize: true,
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
    return { refresh: () => {} };
  }

  if (currentOptions.force) {
    log('Force option enabled, applying polyfill regardless');
  }

  let rafId = null;
  // Coalesce bursts of resize notifications into a single pass per frame
  function scheduleReevaluation() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      log('Re-evaluating elements after resize');
      applyToExistingElements();
    });
  }

  // One observer for all targets: cost scales with element count, not observer count
  const observedElements = new WeakSet();
  const resizeObserver =
    currentOptions.observeResize && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleReevaluation)
      : null;

  const trackSize = (element) => {
    if (!resizeObserver || observedElements.has(element)) return;
    observedElements.add(element);
    resizeObserver.observe(element);
  };

  // Detached targets would otherwise be retained by the observer
  const untrackSize = (element) => {
    if (!resizeObserver || !observedElements.has(element)) return;
    observedElements.delete(element);
    resizeObserver.unobserve(element);
  };

  // Add tabindex when an element overflows, remove it again when it no longer does.
  // Only attributes added by this polyfill (flagged with MARKER) are ever removed.
  const makeScrollableFocusable = (element) => {
    trackSize(element);

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

  // Run fn on root and any descendant matching the configured selectors
  const forEachMatch = (root, fn) => {
    currentOptions.selectors.forEach((selector) => {
      try {
        if (root.matches?.(selector)) {
          fn(root);
        }
        root.querySelectorAll?.(selector).forEach(fn);
      } catch (e) {
        log('Error with selector', selector, e);
      }
    });
  };

  const matchesAnySelector = (element) =>
    currentOptions.selectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch (e) {
        log('Error with selector', selector, e);
        return false;
      }
    });

  // A mutation deep inside an element changes its scrollWidth/scrollHeight without
  // changing its box, so ResizeObserver stays silent and the ancestors need checking
  const collectMatchingAncestors = (node, pending) => {
    let element = node.nodeType === 1 ? node : node.parentElement;

    while (element) {
      if (matchesAnySelector(element)) {
        pending.add(element);
      }
      element = element.parentElement;
    }
  };

  // Apply to all potentially scrollable elements
  const applyToExistingElements = () => {
    log('Applying to existing elements with selectors:', currentOptions.selectors);
    forEachMatch(document.documentElement, makeScrollableFocusable);
  };

  // Observe DOM changes and apply polyfill to new elements
  const observer = new MutationObserver((mutations) => {
    const pending = new Set();

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          forEachMatch(node, (element) => pending.add(element));
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          forEachMatch(node, untrackSize);
        }
      });

      collectMatchingAncestors(mutation.target, pending);
    });

    pending.forEach(makeScrollableFocusable);
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyToExistingElements);
  } else {
    applyToExistingElements();
  }

  // Start observing
  observer.observe(document.documentElement, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  window.addEventListener('resize', scheduleReevaluation);

  log('Polyfill applied and observers started');

  return { refresh: applyToExistingElements };
}
