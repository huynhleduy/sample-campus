import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tsFiles = ['**/*.ts'];

const tsRecommendedRules = tsPlugin.configs.recommended.rules;

export default [
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      '.cache/**',
      '.yarn/**',
      'database/migrations/**',
      'ormconfig.ts',
      'scripts/**',
    ],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  {
    ...js.configs.recommended,
    files: tsFiles,
  },
  {
    ...importPlugin.flatConfigs.recommended,
    files: tsFiles,
  },
  {
    ...importPlugin.flatConfigs.typescript,
    files: tsFiles,
  },
  {
    ...prettierRecommended,
    files: tsFiles,
  },
  {
    files: tsFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        project: path.join(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      ...tsRecommendedRules,
      'prettier/prettier': 'error',
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'no-dupe-class-members': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'unknown',
            'sibling',
            'index',
            'parent',
            'type',
            'object',
          ],
          alphabetize: {
            order: 'asc',
            orderImportKind: 'asc',
            caseInsensitive: false,
          },
          named: {
            enabled: true,
            types: 'types-last',
          },
        },
      ],
    },
  },
];
