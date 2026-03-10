import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sharedNoRestrictedImports = [
  'error',
  {
    patterns: [
      {
        group: ['**/src/**', '!**/src/index.{ts,tsx}'],
        message: 'Deep imports are forbidden. Import from the package root instead.',
      },
    ],
  },
];

export default [
  {
    ignores: [
      '**/dist/**',
      '**/out/**',
      '**/coverage/**',
      '**/*.d.ts',
      '**/*.tsbuildinfo',
      'e2e/**/*.js',
    ],
  },

  js.configs.recommended,

  // ✅ TypeScript support (fixes: `import type` parsing)
  ...tseslint.configs.recommended,

  // ✅ Vue support (includes vue-eslint-parser internally)
  ...pluginVue.configs['flat/recommended'],

  // ✅ Keep Prettier last-ish so it can disable conflicting rules
  prettier,

  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'warn',

      // IMPORTANT: in TS projects prefer @typescript-eslint/no-unused-vars and disable base rule
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'no-restricted-imports': sharedNoRestrictedImports,
    },
  },
];
