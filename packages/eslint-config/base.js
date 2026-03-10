import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import {globalIgnores} from 'eslint/config';

/** @type {import('eslint').Linter.Config[]} */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  {
    plugins: {
      turbo: turboPlugin,
      import: importPlugin
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
  {
    rules: {
      'prettier/prettier': ['error', {
        'printWidth': 120,
        'semi': true,
        'singleQuote': true,
        'bracketSpacing': false,
        'trailingComma': 'es5',
        'tabWidth': 2,
        'useTabs': false
      }],
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'eol-last': ['error', 'always'],
      'no-tabs': 'error',
      'no-trailing-spaces': ['error', {
        'skipBlankLines': false,
        'ignoreComments': false
      }],
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
            prefer: 'type-imports',
            disallowTypeAnnotations: false
        }
      ],
      '@typescript-eslint/no-misused-promises': 'off',
      'curly': ['error', 'all'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'block-like', next: '*' }
      ],

      'import/no-duplicates': 'warn',
      'import/newline-after-import': ['error', { count: 1 }],
      'import/first': 'error',
      'import/order': [
        'error',
        {
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
            pathGroups: [
              {
                pattern: '../../**',
                group: 'parent',
                position: 'before'
              },
            ],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  globalIgnores([
    'dist/**',
    'packages/eslint-config/base.js',
  ]),
];
