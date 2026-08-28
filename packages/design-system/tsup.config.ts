import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  // Component CSS is imported from .tsx files; inline it into the JS bundle so
  // consumers get styles without a separate CSS import.
  injectStyle: true,
  external: ['react', 'react-dom'],
});
