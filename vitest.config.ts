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
    // Dummy Supabase env so lib/supabase.ts can construct a client at import
    // time. Tests never hit the network — they mock ./supabase or ./api.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      TZ: 'UTC',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'packages/*/src/**/*.{test,spec}.{ts,tsx}',
        'packages/*/src/**/*.stories.{ts,tsx}',
        'packages/*/src/**/index.ts',
        'packages/web/src/lib/api-types.ts',
        'packages/web/src/lib/database.types.ts',
        'packages/web/src/lib/supabase.ts',
        'packages/web/src/vite-env.d.ts',
        'packages/web/src/main.tsx',
      ],
      thresholds: {
        // The plan's gate: pure logic + data helpers must stay well covered.
        'packages/web/src/lib/**': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
