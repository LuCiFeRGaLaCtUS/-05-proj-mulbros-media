import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // React 18 — JSX transform doesn't require React in scope
      'no-unused-vars': ['warn', { varsIgnorePattern: '^React$|^_', argsIgnorePattern: '^_' }],
      // Empty catch blocks are intentional in localStorage/sessionStorage helpers
      'no-empty': ['warn', { allowEmptyCatch: true }],
      // Control characters in regex are intentional in PDF safe() helper
      'no-control-regex': 'off',
      // setState in effects is sometimes unavoidable for sync-from-prop patterns;
      // flag as warn so CI doesn't fail, but still surfaces as visible feedback
      'react-hooks/set-state-in-effect': 'warn',
      'no-console': 'off',
    },
  },
  { ignores: ['dist/**', 'node_modules/**'] },
];
