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
<!-- IIFE version (auto-executes) -->
<script src="https://unpkg.com/scroll-focus-polyfill/dist/scroll-focus-polyfill.js"></script>

<!-- ES Module version -->
<script type="module">
  import 'https://unpkg.com/scroll-focus-polyfill/dist/scroll-focus-polyfill.mjs';
</script>

<!-- You can also specify a version -->
<script src="https://unpkg.com/scroll-focus-polyfill@latest/dist/scroll-focus-polyfill.js"></script>
```

## Usage

### Automatic Usage (Recommended)

The polyfill runs automatically when imported:

#### ES Modules

```javascript
import 'scroll-focus-polyfill';
```

#### CommonJS

```javascript
require('scroll-focus-polyfill');
```

#### HTML Script Tag

```html
<script src="node_modules/scroll-focus-polyfill/dist/scroll-focus-polyfill.js"></script>
```

Or via CDN:

```html
<script src="https://unpkg.com/scroll-focus-polyfill/dist/scroll-focus-polyfill.js"></script>
```

### Manual Usage with Options

If you want more control, you can manually trigger the polyfill with custom options:

```javascript
import { applyPolyfill } from 'scroll-focus-polyfill';

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

