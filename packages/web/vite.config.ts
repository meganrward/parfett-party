import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dsSrc = (path: string) =>
  fileURLToPath(new URL(`../design-system/src/${path}`, import.meta.url));

// Served from https://<user>.github.io/parfett-party/
export default defineConfig({
  base: '/parfett-party/',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@parfett\/design-system$/, replacement: dsSrc('index.ts') },
      { find: '@parfett/design-system/tokens.css', replacement: dsSrc('tokens/tokens.css') },
    ],
  },
  // Dedicated port so it never collides with other local dev servers.
  server: { port: 5273, strictPort: true },
});
