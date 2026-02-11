import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/auto.js'),
      name: 'ScrollFocusPolyfill',
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => {
        if (format === 'es') return 'scroll-focus-polyfill.mjs';
        if (format === 'umd') return 'scroll-focus-polyfill.umd.js';
        return 'scroll-focus-polyfill.js';
      }
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
