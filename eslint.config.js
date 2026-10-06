const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const expoConfig = require('eslint-config-expo/flat');

module.exports = tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      'apps/mobile/android/**',
      'apps/mobile/ios/**',
      'docs/design/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // The engine is pure: no UI, no storage, no platform, no clock of its own
    // and no randomness. "now" is always an explicit input. These rules are
    // the mechanical half of that promise; the rest is review.
    files: ['packages/engine/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'The engine takes "now" as an input. Never read the clock.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'The engine takes "now" as an input. Never read the clock.',
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'The engine must be deterministic. Break ties by a fixed order instead.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'expo', 'expo-*', 'node:*', 'fs', 'path'],
              message: 'The engine is pure TypeScript: no UI, storage or platform imports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/engine/test/**/*.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['apps/mobile/**/*.{ts,tsx,js}'],
    extends: [expoConfig],
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // TypeScript already resolves these, and it understands the monorepo
      // and the "@/" alias. eslint-plugin-import's resolver does not.
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
      'import/no-duplicates': 'off',
    },
  },
  {
    // Build-tool config files are CommonJS and run in Node.
    files: ['eslint.config.js', '**/metro.config.js', '**/babel.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'writable', __dirname: 'readonly' },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
