# scroll-focus-polyfill

![Package version](https://img.shields.io/github/package-json/v/Th3S4mur41/scroll-focus-polyfill)
![GitHub last commit](https://img.shields.io/github/last-commit/Th3S4mur41/scroll-focus-polyfill)
![Release](https://github.com/Th3S4mur41/scroll-focus-polyfill/actions/workflows/release.yml/badge.svg?branch=main)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Th3S4mur41/scroll-focus-polyfill/badge)](https://scorecard.dev/viewer/?uri=github.com/Th3S4mur41/scroll-focus-polyfill)

A tiny polyfill for browsers that cannot focus a scrollable element (notably affecting keyboard accessibility of horizontally scrollable `<pre>` blocks in some environments).

## Why?

Some browsers, especially older versions or specific rendering engines, do not allow scrollable elements to receive keyboard focus. This can create accessibility issues, particularly for horizontally scrollable `<pre>` blocks or other scrollable containers that should be navigable via keyboard.

This polyfill automatically detects if the browser has this limitation and applies a fix by adding `tabindex="0"` to scrollable elements, making them keyboard accessible.

## Installation

### via npm

```bash
npm install scroll-focus-polyfill
```

### via unpkg.com (CDN)

You can import the polyfill directly from unpkg.com without any build step:

```html
<!-- Auto-execute version (detects and applies automatically) -->
<script src="https://unpkg.com/scroll-focus-polyfill"></script>

<!-- ES Module version -->
<script type="module">
  import 'https://unpkg.com/scroll-focus-polyfill';
</script>
```

## Usage

### Quick Start (Automatic)

The simplest way to use the polyfill is to just import it. It will automatically detect if it's needed and apply itself:

#### HTML Script Tag

```html
<script src="https://unpkg.com/scroll-focus-polyfill"></script>
```

Or with npm:

```html
<script src="node_modules/scroll-focus-polyfill"></script>
```

#### ES Modules

```javascript
// Auto-executes on import
import 'scroll-focus-polyfill';
```

#### CommonJS

```javascript
// Auto-executes on require
require('scroll-focus-polyfill');
```

### With Options (Data Attributes)

You can configure the polyfill using data attributes on the script tag:

```html
<!-- Enable debug logging -->
<script src="https://unpkg.com/scroll-focus-polyfill" data-debug="true"></script>

<!-- Force application (skip browser detection) -->
<script src="https://unpkg.com/scroll-focus-polyfill" data-force="true"></script>

<!-- Custom selectors -->
<script src="https://unpkg.com/scroll-focus-polyfill" data-selectors="pre, .scrollable, [data-scroll]"></script>

<!-- Disable per-element resize observation -->
<script src="https://unpkg.com/scroll-focus-polyfill" data-observe-resize="false"></script>

<!-- Combine multiple options -->
<script src="https://unpkg.com/scroll-focus-polyfill" 
        data-debug="true" 
        data-force="true"
        data-selectors="pre, .code-block"></script>
```

### Manual Control

If you want full control over when and how the polyfill is applied, use the function export:

```javascript
// Import the function export (does NOT auto-execute)
import { applyPolyfill } from 'scroll-focus-polyfill/fn';

// Apply with default options
applyPolyfill();

// Apply with custom options
applyPolyfill({
  debug: false,         // Enable debug logging (default: false)
  force: false,         // Force polyfill even if browser supports focus (default: false)
  observeResize: true,  // Re-evaluate elements when their size changes (default: true)
  selectors: ['pre']    // CSS selectors for elements to make focusable (default: ['pre'])
});

// Example: Enable debug logging
applyPolyfill({ debug: true });

// Example: Apply to custom elements
applyPolyfill({ selectors: ['pre', '.scrollable', '[data-scroll]'] });

// Example: Force application with custom selectors
applyPolyfill({ 
  force: true, 
  selectors: ['pre', '.code-block'] 
});
```

## Entry Points

The package provides two entry points for different use cases:

| Entry Point | Auto-Execute | Use Case |
|------------|--------------|----------|
| `scroll-focus-polyfill` (default) | ✅ Yes | Quick plug-and-play with automatic detection |
| `scroll-focus-polyfill/fn` | ❌ No | Full control over application timing and options |

### Examples

```javascript
// Default: Auto-execute with detection
import 'scroll-focus-polyfill';

// Function export: No auto-execute, full control
import { applyPolyfill } from 'scroll-focus-polyfill/fn';
applyPolyfill({ debug: true });

// Force mode via function export
import { applyPolyfill } from 'scroll-focus-polyfill/fn';
applyPolyfill({ force: true });
```

### HTML Script Tag Usage

```html
<!-- Default: Auto-execute with detection -->
<script src="https://unpkg.com/scroll-focus-polyfill"></script>

<!-- Force mode via data attribute -->
<script src="https://unpkg.com/scroll-focus-polyfill" data-force="true"></script>

<!-- With options via data attributes -->
<script src="https://unpkg.com/scroll-focus-polyfill" 
        data-debug="true" 
        data-selectors="pre, .scrollable"></script>
```

## Options

- **`debug`** (boolean, default: `false`): Enable console logging for debugging
- **`force`** (boolean, default: `false`): Force the polyfill to apply even if the browser natively supports focusing scrollable elements
- **`observeResize`** (boolean, default: `true`): Watch matching elements with a `ResizeObserver` so `tabindex` stays correct when an element's own box changes size. Set to `false` on pages with very large numbers of matching elements and call `refresh()` manually instead
- **`selectors`** (array, default: `['pre']`): CSS selectors for elements that should be made focusable when they have scrollable content

## Manual refresh

`applyPolyfill()` returns a handle with a `refresh()` method that re-evaluates every matching element. This is useful when `observeResize` is disabled, or after a layout change the polyfill cannot detect:

```javascript
import { applyPolyfill } from 'scroll-focus-polyfill/fn';

const polyfill = applyPolyfill({ observeResize: false });

// After your own layout change (panel toggle, split view drag, etc.)
polyfill.refresh();
```

## How it Works

1. **Detection**: The polyfill checks if the browser needs it by testing if a `<pre>` element with scrollable content can receive focus
2. **Application**: If needed (or if `force: true`), it adds `tabindex="0"` to matching elements that have scrollable content
3. **Observation**: It monitors the DOM for new elements and applies the fix automatically. Because content added, edited or restyled *inside* a matching element changes its `scrollWidth`/`scrollHeight` without changing its own box, every mutation also re-evaluates its matching ancestors. Child list, `characterData` and attribute changes are all observed, so text edits and `class`/`style` changes are covered
4. **Re-evaluation**: It also re-checks elements when sizes change, adding `tabindex="0"` when a scrollbar appears and removing it again when the content no longer overflows. A single `ResizeObserver` watches each matching element, so changes caused by a sibling, sidebar or grid track are detected even when the viewport stays the same size. Elements removed from the DOM are unobserved automatically

Elements that already had a `tabindex` before the polyfill ran are never modified. Attributes added by the polyfill are flagged with `data-scroll-focus-polyfill`, and are only removed while they still hold the value the polyfill assigned, so an application that takes over the `tabindex` keeps full control of it.

## Browser Support

This polyfill works in all modern browsers and will only activate if needed. It uses:

- `MutationObserver` for DOM monitoring
- `ResizeObserver` (when available) and the `resize` event for size changes
- Standard DOM APIs for element detection

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed information about:

- Development setup
- Available scripts
- Commit guidelines
- Pull request process
- Code style

This project uses:

- **Vite** for building and bundling
- **Biome** for linting and formatting
- **commitlint** for conventional commits
- **lefthook** for git hooks
- **semantic-release** for automated versioning

Please ensure your commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## License

MIT

