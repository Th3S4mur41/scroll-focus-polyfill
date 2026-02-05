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

### Manual Usage

If you want more control, you can manually trigger the polyfill:

```javascript
import { applyPolyfill } from 'scroll-focus-polyfill';

// Apply the polyfill manually
applyPolyfill();
```

## How it Works

1. **Detection**: The polyfill first checks if the browser needs it by testing if scrollable elements can receive focus
2. **Application**: If needed, it adds `tabindex="0"` to scrollable elements (like `<pre>` blocks)
3. **Observation**: It monitors the DOM for new scrollable elements and applies the fix automatically

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

```bash
npm run lint
npm run format
```

### Scripts

- `npm run build` - Build the production bundle
- `npm run dev` - Start development server
- `npm run lint` - Lint the code
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format the code
- `npm run check` - Run both linting and formatting checks

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

