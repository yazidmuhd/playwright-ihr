import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules', 'playwright-report', 'test-results', 'blob-report', '.auth'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // The test server scripts run in Node
  { files: ['e2e-server/**/*.mjs'], languageOptions: { globals: globals.node } },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Page objects carry their own assertions, e.g. cartPage.expectProducts(...)
      'playwright/expect-expect': [
        'error',
        { assertFunctionPatterns: ['^expect[A-Z]', '\\.expect[A-Z]\\w*$'] },
      ],
    },
  },
);
