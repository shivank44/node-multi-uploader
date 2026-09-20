// eslint.config.js
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // 1. Base recommended rules
  js.configs.recommended,

  // 2. Global settings for all files
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  // 3. Your custom rules
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-process-exit': 'off',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      indent: ['error', 2, { SwitchCase: 1 }],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      }],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'no-throw-literal': 'error',
      'no-return-await': 'error',
      'require-await': 'warn',
      'no-shadow': 'warn',
    },
  },

  // 4. Test file overrides
  {
    files: ['test/**/*.js', '**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },

  // 5. Global ignores (replaces the old "ignorePatterns")
  {
    ignores: [
      'node_modules/',
      'coverage/',
      'dist/',
      'uploads/',
      'examples/',
    ],
  },
];