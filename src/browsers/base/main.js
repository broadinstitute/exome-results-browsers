import 'core-js/stable'
import React from 'react'
import { render } from 'react-dom'
import { hot } from 'react-hot-loader/root'

// __BROWSER_APP_PATH__ is a resolve alias set in webpack.config.js
import Browser from '__BROWSER_APP_PATH__' // eslint-disable-line import/no-unresolved

const App = hot(Browser)

const mount = document.getElementById('root')

render(<App />, mount)
