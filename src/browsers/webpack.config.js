const path = require('path')

const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')

if (process.env.BROWSER === undefined) {
  // eslint-disable-next-line no-console
  console.error('BROWSER environment variable must be set')
  process.exit(1)
}

const currentBrowser = process.env.BROWSER

const isDev = process.env.NODE_ENV === 'development'

const config = {
  devServer: {
    port: 8000,
    proxy: {
      '/': `http://localhost:${process.env.PORT}`,
    },
    publicPath: '/',
    stats: 'errors-only',
    // Write files to disk so that server.js can respond with index.html.
    writeToDisk: true,
  },
  devtool: 'source-map',
  entry: {
    bundle: path.resolve(__dirname, './base/main.js'),
  },
  mode: isDev ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            rootMode: 'upward',
          },
        },
      },
      {
        test: /\.(gif|jpg|png)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'assets/images',
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, '../server/public', currentBrowser),
    publicPath: '/',
    filename: isDev ? '[name].js' : '[name]-[contenthash].js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: require.resolve('normalize.css'),
          transform(content) {
            // Minify CSS
            return content
              .toString()
              .replace(/\n/g, '')
              .replace(/\/\*[* ].+?\*\//g, '') // Remove comments
              .replace(/\s+\{\s+/g, '{') // Remove space around braces
              .replace(/;\s+/g, ';') // Remove space between rules
              .replace(/:\s+/g, ':') // Remove space between property and value
          },
        },
      ],
    }),
    new HtmlPlugin({
      template: path.resolve(__dirname, './base/index.html'),
      templateParameters: {
        gaTrackingId: process.env[`${currentBrowser}_BROWSER_GA_TRACKING_ID`],
      },
    }),
  ],
  resolve: {
    alias: {
      __BROWSER_APP_PATH__: path.resolve(
        __dirname,
        currentBrowser.toLowerCase(),
        `${currentBrowser}Browser`
      ),
    },
  },
}

if (isDev) {
  config.resolve.alias['react-dom'] = '@hot-loader/react-dom'
}

module.exports = config
