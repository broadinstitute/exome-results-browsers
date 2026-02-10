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
      files: ['src/server/**/*.js'],
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
