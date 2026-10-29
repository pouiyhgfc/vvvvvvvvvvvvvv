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
      // Groter dan ~400 regels: opsplitsen (zie CLAUDE.md, "Codekwaliteit").
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Gegenereerde of vaste data (iconen, surahs): lang is daar prima.
    files: ['src/ui/glyphs.js', 'src/lib/surahs.js'],
    rules: { 'max-lines': 'off' },
  },
  {
    // Kleuren via tokens (zie .claude/rules/ui.md). Echte datakleuren
    // (event-/routinekleur, heatmap) staan in lib/ en zijn hier niet geraakt.
    files: ['src/**/*.jsx'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Gebruik een kleurtoken (var(--…)) in plaats van een harde hexkleur.',
        },
      ],
    },
  },
  {
    files: ['src/sw.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.serviceworker } },
  },
];
