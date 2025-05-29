import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import nestjs from 'eslint-plugin-nestjs';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['.eslintrc.js', 'node_modules/**/*', 'dist/**/*'],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
        allowDefaultProject: ['.eslintrc.js', 'test/**/*'],
      },
      globals: {
        node: true,
        jest: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      prettier,
      nestjs,
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-call': 'error',
      'prettier/prettier': 'error',
      ...nestjs.configs.recommended.rules,
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...typescriptEslintPlugin.configs['recommended-requiring-type-checking']
        .rules,
    },
  },
  {
    files: ['src/main.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
];
