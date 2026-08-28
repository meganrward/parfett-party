import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const dsSrc = (path: string) =>
  fileURLToPath(new URL(`./packages/design-system/src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@parfett\/design-system$/, replacement: dsSrc('index.ts') },
      { find: '@parfett/design-system/tokens.css', replacement: dsSrc('tokens/tokens.css') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['packages/*/src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'packages/*/src/**/*.{test,spec}.{ts,tsx}',
        'packages/*/src/**/*.stories.{ts,tsx}',
        'packages/*/src/**/index.ts',
      ],
    },
  },
});
