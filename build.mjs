import { build } from 'vite';
import { resolve } from 'path';

const entries = [
  { name: 'scroll-focus-polyfill', input: 'src/auto.js' },
  { name: 'scroll-focus-polyfill.manual', input: 'src/index.js' },
];

async function buildAll() {
  for (const entry of entries) {
    console.log(`Building ${entry.name}...`);
    
    // Build ES module
    await build({
      configFile: false,
      build: {
        outDir: 'dist',
        emptyOutDir: false, // Don't empty the directory between builds
        lib: {
          entry: resolve(process.cwd(), entry.input),
          name: 'ScrollFocusPolyfill',
          formats: ['es'],
          fileName: () => `${entry.name}.mjs`,
        },
        minify: 'terser',
        sourcemap: true,
        rollupOptions: {
          output: {
            exports: 'named',
          }
        }
      }
    });
    
    // Build UMD
    await build({
      configFile: false,
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve(process.cwd(), entry.input),
          name: 'ScrollFocusPolyfill',
          formats: ['umd'],
          fileName: () => `${entry.name}.umd.js`,
        },
        minify: 'terser',
        sourcemap: true,
        rollupOptions: {
          output: {
            exports: 'named',
          }
        }
      }
    });
    
    // Build IIFE
    await build({
      configFile: false,
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve(process.cwd(), entry.input),
          name: 'ScrollFocusPolyfill',
          formats: ['iife'],
          fileName: () => `${entry.name}.js`,
        },
        minify: 'terser',
        sourcemap: true,
        rollupOptions: {
          output: {
            exports: 'named',
          }
        }
      }
    });
  }
  
  console.log('Build complete!');
}

buildAll().catch(console.error);
