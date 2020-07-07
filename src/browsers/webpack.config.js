const path = require('path')

const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')

const BROWSERS = ['ASC', 'BipEx', 'Epi25', 'SCHEMA']

const isDev = process.env.NODE_ENV === 'development'

let config = BROWSERS.map((browser) => {
  const browserConfig = {
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
          test: /\.(gif|jpg|png|svg)$/,
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
      path: path.resolve(__dirname, '../server/public', browser),
      publicPath: '/',
      filename: isDev ? '[name].js' : '[name]-[contenthash].js',
    },
    plugins: [
      new CleanWebpackPlugin({
        cleanAfterEveryBuildPatterns: ['!index.html'],
      }),
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
          gaTrackingId: process.env[`${browser}_BROWSER_GA_TRACKING_ID`],
        },
      }),
    ],
    resolve: {
      alias: {
        __BROWSER_APP_PATH__: path.resolve(__dirname, browser.toLowerCase(), `${browser}Browser`),
      },
    },
  }

  if (isDev) {
    browserConfig.resolve.alias['react-dom'] = '@hot-loader/react-dom'
  }

  return browserConfig
})

if (process.env.WEBPACK_DEV_SERVER) {
  if (process.env.BROWSER === undefined) {
    // eslint-disable-next-line no-console
    console.error('BROWSER environment variable must be set')
    process.exit(1)
  }

  if (!BROWSERS.includes(process.env.BROWSER)) {
    // eslint-disable-next-line no-console
    console.error(`Unrecognized browser. Choose one of ${BROWSERS.join(', ')}`)
    process.exit(1)
  }

  const selectedBrowser = process.env.BROWSER

  config = config[BROWSERS.indexOf(selectedBrowser)]

  const useRemoteApi = JSON.parse(process.env.USE_REMOTE_API || 'false')
  const serverPort = JSON.parse(process.env.PORT || '8010')

  const proxyConfig = useRemoteApi
    ? [
        {
          context: ['/api', '/config.js'],
          target: `https://${selectedBrowser.toLowerCase()}.broadinstitute.org`,
          changeOrigin: true,
        },
      ]
    : {
        '/': `http://localhost:${serverPort}`,
      }

  config.devServer = {
    historyApiFallback: useRemoteApi,
    port: 8000,
    proxy: proxyConfig,
    publicPath: '/',
    stats: 'errors-only',
    // Write files to disk so that server.js can respond with index.html.
    writeToDisk: true,
  }
}

module.exports = config
