import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      // Een niet-bestaande naam breekt pas als die code draait (wit scherm);
      // Vite bouwt er gewoon overheen. Zo vangt lint het al.
      'no-undef': 'error',
    },
  },
  {
    files: ['src/sw.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.serviceworker } },
  },
];
