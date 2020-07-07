module.exports = {
  extends: ['airbnb', 'prettier', 'prettier/react'],
  env: {
    browser: true,
  },
  parser: 'babel-eslint',
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'react/jsx-filename-extension': ['error', { extensions: ['.js'] }],
    'react/jsx-props-no-spreading': 'off',
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
