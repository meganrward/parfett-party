import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import sonarjs from 'eslint-plugin-sonarjs';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** Shared rules that encode this project's conventions. */
const conventions = {
  rules: {
    // Named exports only — no default exports anywhere.
    'import/no-default-export': 'error',
    // async/await only — ban raw promise .then()/.catch()/.finally() chains.
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'CallExpression > MemberExpression.callee[property.name=/^(then|catch|finally)$/]',
        message: 'Use async/await instead of promise .then()/.catch()/.finally() chains.',
      },
    ],
  },
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/storybook-static/**',
      '**/node_modules/**',
      // Deno runtime — type-checked with `deno check`, tested with `deno test`.
      'supabase/functions/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { typescript: true, node: true },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...conventions.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Config files, Vite/Vitest configs and Storybook stories are allowed default exports.
  {
    files: [
      '**/*.config.{ts,js}',
      '**/vite.config.ts',
      '**/vitest.config.ts',
      '**/*.stories.{ts,tsx}',
      '**/.storybook/**',
    ],
    rules: { 'import/no-default-export': 'off' },
  },
  prettier,
);
