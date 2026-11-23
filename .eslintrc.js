module.exports = {
  extends: ['airbnb', 'prettier', 'prettier/react'],
  env: {
    browser: true,
    es2020: true,
  },
  parser: 'babel-eslint',
  plugins: ['prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    'prettier/prettier': 'error',
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    'react/jsx-props-no-spreading': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/eslint-recommended'],
      rules: {
        // Field names mirror the pipeline's snake_case JSON output.
        camelcase: 'off',
        'react/prop-types': 'off',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { vars: 'all', args: 'after-used', argsIgnorePattern: '^_', ignoreRestSiblings: true },
        ],
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': [
          'error',
          { functions: true, classes: true, variables: true },
        ],
      },
    },
    {
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.factory.ts',
        'src/browsers/jest.setup.ts',
        'src/browsers/testUtils/**',
        'e2e/**',
        'playwright.config.ts',
      ],
      env: {
        node: true,
      },
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true, packageDir: [__dirname, `${__dirname}/src/browsers`] },
        ],
        'no-restricted-syntax': 'off',
        'class-methods-use-this': 'off',
        'no-await-in-loop': 'off',
      },
    },
    {
      // Allow importing workspace's dev dependencies in webpack config
      files: ['src/browsers/webpack.config.js'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true, packageDir: __dirname },
        ],
      },
    },
    {
      // Set environment for server-side code
      files: ['src/server/**/*.js', 'src/server/**/*.ts'],
      env: {
        browser: false,
        node: true,
      },
      rules: {
        // Allow for...of, etc in server-side code
        'no-restricted-syntax': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: '2018',
  },
}
