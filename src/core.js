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

// Marks elements whose tabindex was added by this polyfill, so it can be safely removed
const MARKER = 'data-scroll-focus-polyfill';

const ownershipKey = Symbol.for('scroll-focus-polyfill.selector-owners');
let selectorOwners = globalThis[ownershipKey];
if (!selectorOwners) {
  selectorOwners = new WeakMap();
  globalThis[ownershipKey] = selectorOwners;
}

const getMutationNewValues = (mutations) => {
  const newValues = new Map();
  const currentValues = new Map();

  for (let index = mutations.length - 1; index >= 0; index -= 1) {
    const mutation = mutations[index];
    if (mutation.type !== 'attributes') continue;

    let attributes = currentValues.get(mutation.target);
    if (!attributes) {
      attributes = new Map();
      currentValues.set(mutation.target, attributes);
    }

    const name = mutation.attributeName;
    const newValue = attributes.has(name)
      ? attributes.get(name)
      : mutation.target.getAttribute(name);
    newValues.set(mutation, newValue);
    attributes.set(name, mutation.oldValue);
  }

  return newValues;
};

// Logger that only logs when debug is enabled
const createLogger = (options) => {
  return (...args) => {
    if (options.debug) {
      console.log('[scroll-focus-polyfill]', ...args);
    }
  };
};

// Check if the polyfill is needed
function isPolyfillNeeded(log) {
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

  const container = document.body ?? document.documentElement;
  container.appendChild(test);

  // Try focusing it
  test.focus({ preventScroll: true });
  const result = document.activeElement === test;

  log(`Test element is focusable: ${result}`);

  // Cleanup
  container.removeChild(test);

  return !result;
}

// Apply the polyfill
export function applyPolyfill(options = {}) {
  // Options are per invocation so a later call cannot retarget this instance
  const settings = { ...defaultOptions, ...options };
  const log = createLogger(settings);
  const ownAttributeWrites = new WeakMap();

  const recordOwnAttributeWrite = (element, name, oldValue, newValue) => {
    let attributes = ownAttributeWrites.get(element);
    if (!attributes) {
      attributes = new Map();
      ownAttributeWrites.set(element, attributes);
    }

    let writes = attributes.get(name);
    if (!writes) {
      writes = [];
      attributes.set(name, writes);
    }

    writes.push({ oldValue, newValue });
  };

  const setPolyfillAttribute = (element, name, value) => {
    const oldValue = element.getAttribute(name);
    if (oldValue === value) return;
    recordOwnAttributeWrite(element, name, oldValue, value);
    element.setAttribute(name, value);
  };

  const removePolyfillAttribute = (element, name) => {
    if (!element.hasAttribute(name)) return;
    recordOwnAttributeWrite(element, name, element.getAttribute(name), null);
    element.removeAttribute(name);
  };

  const consumeOwnAttributeWrite = (mutation, newValue) => {
    const attributes = ownAttributeWrites.get(mutation.target);
    const writes = attributes?.get(mutation.attributeName);
    if (!writes) return false;

    const writeIndex = writes.findIndex(
      (write) => write.oldValue === mutation.oldValue && write.newValue === newValue,
    );
    if (writeIndex === -1) return false;

    writes.splice(writeIndex, 1);
    if (writes.length === 0) attributes.delete(mutation.attributeName);
    if (attributes.size === 0) ownAttributeWrites.delete(mutation.target);
    return true;
  };

  log('Applying polyfill with options:', settings);

  if (!settings.force && !isPolyfillNeeded(log)) {
    log('Polyfill not needed, skipping');
    return { refresh: () => {} };
  }

  if (settings.force) {
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
  const managedElements = new Set();
  const instanceId = Symbol('scroll-focus-polyfill-instance');
  const resizeObserver =
    settings.observeResize && typeof ResizeObserver !== 'undefined'
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

  const releaseOwnership = (element) => {
    const owners = selectorOwners.get(element);
    if (!owners) return true;

    owners.delete(instanceId);
    if (owners.size > 0) return false;

    selectorOwners.delete(element);
    return true;
  };

  const stopManaging = (element, pending, clearOwnedAttributes = false) => {
    pending.delete(element);
    managedElements.delete(element);
    untrackSize(element);

    const hasNoOwners = releaseOwnership(element);
    if (clearOwnedAttributes && hasNoOwners && element.hasAttribute(MARKER)) {
      if (element.getAttribute('tabindex') === '0') {
        removePolyfillAttribute(element, 'tabindex');
      }
      removePolyfillAttribute(element, MARKER);
    }
  };

  // Add tabindex when an element overflows, remove it again when it no longer does.
  // Only attributes added by this polyfill (flagged with MARKER) are ever removed.
  const makeScrollableFocusable = (element) => {
    let owners = selectorOwners.get(element);
    if (!owners) {
      owners = new Set();
      selectorOwners.set(element, owners);
    }
    owners.add(instanceId);
    managedElements.add(element);
    trackSize(element);

    const hasOverflow =
      element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

    if (hasOverflow) {
      if (!element.hasAttribute('tabindex')) {
        setPolyfillAttribute(element, 'tabindex', '0');
        setPolyfillAttribute(element, MARKER, '');
        log('Added tabindex to element:', element.tagName.toLowerCase());
      }
      return;
    }

    if (element.hasAttribute(MARKER)) {
      // The app may have taken over the value since we set it; in that case leave it alone
      if (element.getAttribute('tabindex') === '0') {
        removePolyfillAttribute(element, 'tabindex');
        log('Removed tabindex from element:', element.tagName.toLowerCase());
      }
      removePolyfillAttribute(element, MARKER);
    }
  };

  // Run fn on root and any descendant matching the configured selectors
  const forEachMatch = (root, fn) => {
    settings.selectors.forEach((selector) => {
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
    settings.selectors.some((selector) => {
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

  const collectParentScope = (node, scopes) => {
    const element = node.nodeType === 1 ? node : node.parentElement;
    const scope = element?.parentElement ?? element;
    if (scope) scopes.add(scope);
  };

  // Apply to all potentially scrollable elements
  const applyToExistingElements = () => {
    log('Applying to existing elements with selectors:', settings.selectors);
    forEachMatch(document.documentElement, makeScrollableFocusable);
  };

  // Observe DOM changes and apply polyfill to new elements
  const observer = new MutationObserver((mutations) => {
    const pending = new Set();
    const scopes = new Set();
    let validateManagedElements = false;
    const mutationNewValues = getMutationNewValues(mutations);

    mutations.forEach((mutation) => {
      // A class or style change on a descendant can make a fixed-size ancestor overflow
      if (mutation.type === 'attributes') {
        if (consumeOwnAttributeWrite(mutation, mutationNewValues.get(mutation))) return;

        collectParentScope(mutation.target, scopes);
        validateManagedElements = true;
        collectMatchingAncestors(mutation.target, pending);
        return;
      }

      validateManagedElements = true;
      if (mutation.target.nodeType === 1 || mutation.target.nodeType === 9) {
        scopes.add(mutation.target);
      } else if (mutation.target.parentElement) {
        scopes.add(mutation.target.parentElement);
      }
      collectParentScope(mutation.target, scopes);

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          collectParentScope(node, scopes);
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;

        // Walk every element, not just current matches: an element that stopped matching
        // before detaching would otherwise stay observed forever
        stopManaging(node, pending);
        node.querySelectorAll?.('*').forEach((element) => {
          stopManaging(element, pending);
        });
      });

      collectMatchingAncestors(mutation.target, pending);
    });

    if (validateManagedElements) {
      managedElements.forEach((element) => {
        if (!matchesAnySelector(element)) {
          stopManaging(element, pending, true);
        }
      });
    }

    scopes.forEach((scope) => {
      forEachMatch(scope, (element) => pending.add(element));
    });

    pending.forEach(makeScrollableFocusable);
  });

  // Start observing before initialization so polyfill writes can be identified
  observer.observe(document.documentElement, {
    attributeOldValue: true,
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyToExistingElements);
  } else {
    applyToExistingElements();
  }

  window.addEventListener('resize', scheduleReevaluation);

  log('Polyfill applied and observers started');

  return { refresh: applyToExistingElements };
}
