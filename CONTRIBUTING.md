# Contributing to scroll-focus-polyfill

Thank you for your interest in contributing! This document provides guidelines and information for developers.

## Development Setup

### Prerequisites

- Node.js LTS version (specified in `.nvmrc`)
- npm

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/Th3S4mur41/scroll-focus-polyfill.git
cd scroll-focus-polyfill

# Install dependencies
npm install
```

The `npm install` command will automatically set up git hooks via lefthook.

## Development Workflow

### Building

Build the library for production:

```bash
npm run build
```

This creates optimized bundles in the `dist/` directory in multiple formats (ES, UMD, IIFE).

### Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for both linting and formatting:

```bash
npm run lint        # Check code for issues
npm run lint:fix    # Auto-fix linting and formatting issues
```

### Development Server

Test the polyfill in a browser environment:

```bash
npm run dev         # Start development server (serves demo.html)
npm run preview     # Preview production build
```

The dev server starts a local Vite server that serves the `demo.html` file at `http://localhost:5173/`.

### Testing

Run the build verification tests:

```bash
npm run test
```

This command builds the project and verifies that all expected output files are generated correctly.

## Available Scripts

- `npm run build` - Build the production bundle
- `npm run dev` - Start development server for testing demo.html
- `npm run preview` - Preview the production build
- `npm run test` - Run build verification tests
- `npm run lint` - Check code for linting and formatting issues
- `npm run lint:fix` - Auto-fix linting and formatting issues

## Project Structure

```
scroll-focus-polyfill/
├── src/
│   ├── auto.js      # Auto-execute entry point
│   ├── core.js      # Core polyfill logic
│   └── index.js     # Function export entry point
├── test/
│   └── build.test.js # Build verification tests
├── .github/
│   └── workflows/   # CI/CD workflows
├── demo.html        # Demo page
└── build.mjs        # Build script
```

## Technology Stack

- **[Vite](https://vitejs.dev/)** - Building and bundling
- **[Biome](https://biomejs.dev/)** - Linting and formatting
- **[commitlint](https://commitlint.js.org/)** - Commit message validation
- **[lefthook](https://github.com/evilmartians/lefthook)** - Git hooks management
- **[semantic-release](https://semantic-release.gitbook.io/)** - Automated versioning and publishing

## Commit Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. All commit messages must follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `build:` - Build system changes
- `ci:` - CI/CD changes
- `chore:` - Other changes that don't modify src or test files
- `revert:` - Revert a previous commit

### Examples

```bash
feat: add support for custom selector options
fix: correct tabindex application on nested elements
docs: update installation instructions
```

## Git Hooks

The project uses lefthook to run checks before commits:

- **pre-commit**: Runs linting and formatting on staged files
- **commit-msg**: Validates commit messages against conventional commits format

## Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes following the code style
4. Ensure all tests pass: `npm run test`
5. Ensure linting passes: `npm run lint`
6. Commit with conventional commit messages
7. Push to your fork and submit a pull request

## Release Process

Releases are automated using semantic-release:

1. Commits to `main` trigger the CI/CD pipeline
2. If checks pass, semantic-release analyzes commits
3. Version is bumped according to commit types
4. Changelog is generated
5. Package is published to npm
6. GitHub release is created

## Code Style

- Use ES modules syntax
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable names

## Questions?

If you have questions or need help, feel free to:

- Open an issue on GitHub
- Check existing issues and discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
