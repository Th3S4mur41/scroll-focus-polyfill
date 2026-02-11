# scroll-focus-polyfill

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

<!-- Or specify the file explicitly -->
<script src="https://unpkg.com/scroll-focus-polyfill/dist/scroll-focus-polyfill.js"></script>

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
<!-- Just reference the package - no need to specify the file! -->
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

<!-- Combine multiple options -->
<script src="https://unpkg.com/scroll-focus-polyfill" 
        data-debug="true" 
        data-selectors="pre, .code-block"></script>
```

### Force Mode (Always Apply)

If you want to always apply the polyfill regardless of browser support, use the force variant:

```html
<!-- Using the force variant -->
<script src="https://unpkg.com/scroll-focus-polyfill/force"></script>
```

Or in JavaScript:

```javascript
import 'scroll-focus-polyfill/force';
```

### Manual Control

If you want full control over when and how the polyfill is applied, use the manual variant:

```javascript
// Import the manual variant (does NOT auto-execute)
import { applyPolyfill } from 'scroll-focus-polyfill/manual';

// Apply with default options
applyPolyfill();

// Apply with custom options
applyPolyfill({
  debug: false,       // Enable debug logging (default: false)
  force: false,       // Force polyfill even if browser supports focus (default: false)
  selectors: ['pre']  // CSS selectors for elements to make focusable (default: ['pre'])
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

The package provides three entry points for different use cases:

| Entry Point | Auto-Execute | Force Mode | Use Case |
|------------|--------------|------------|----------|
| `scroll-focus-polyfill` (default) | ✅ Yes | ❌ No | Quick plug-and-play |
| `scroll-focus-polyfill/manual` | ❌ No | ❌ No | Full control over application |
| `scroll-focus-polyfill/force` | ✅ Yes | ✅ Yes | Always apply, skip detection |

### Examples

```javascript
// Default: Auto-execute with detection
import 'scroll-focus-polyfill';

// Manual: No auto-execute, full control
import { applyPolyfill } from 'scroll-focus-polyfill/manual';
applyPolyfill({ debug: true });

// Force: Auto-execute without detection
import 'scroll-focus-polyfill/force';
```

### HTML Script Tag Usage

```html
<!-- Default: Auto-execute with detection -->
<script src="https://unpkg.com/scroll-focus-polyfill"></script>

<!-- Force: Auto-execute, always apply -->
<script src="https://unpkg.com/scroll-focus-polyfill/force"></script>

<!-- With options via data attributes -->
<script src="https://unpkg.com/scroll-focus-polyfill" 
        data-debug="true" 
        data-selectors="pre, .scrollable"></script>
```

### Options

- **`debug`** (boolean, default: `false`): Enable console logging for debugging
- **`force`** (boolean, default: `false`): Force the polyfill to apply even if the browser natively supports focusing scrollable elements
- **`selectors`** (array, default: `['pre']`): CSS selectors for elements that should be made focusable when they have scrollable content

## How it Works

1. **Detection**: The polyfill checks if the browser needs it by testing if a `<pre>` element with scrollable content can receive focus
2. **Application**: If needed (or if `force: true`), it adds `tabindex="0"` to matching elements that have scrollable content
3. **Observation**: It monitors the DOM for new elements and applies the fix automatically

## Browser Support

This polyfill works in all modern browsers and will only activate if needed. It uses:

- `MutationObserver` for DOM monitoring
- Standard DOM APIs for element detection

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for both linting and formatting:

```bash
npm run lint        # Check code for issues
npm run lint:fix    # Auto-fix linting and formatting issues
```

### Development Server

The project includes a Vite development server for testing the demo:

```bash
npm run dev         # Start development server (serves demo.html)
npm run preview     # Preview production build
```

These commands start a local server that serves the `demo.html` file, allowing you to test the polyfill in a browser environment.

### Scripts

- `npm run build` - Build the production bundle
- `npm run dev` - Start development server for testing demo.html
- `npm run preview` - Preview the production build
- `npm run test` - Run build verification tests
- `npm run lint` - Check code for linting and formatting issues
- `npm run lint:fix` - Auto-fix linting and formatting issues

## Contributing

Contributions are welcome! This project uses:

- **Vite** for building and bundling
- **Biome** for linting and formatting
- **commitlint** for conventional commits
- **lefthook** for git hooks
- **semantic-release** for automated versioning

Please ensure your commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## License

MIT

