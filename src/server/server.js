const fs = require('fs')
const path = require('path')
const process = require('process')
const readline = require('readline')

const compression = require('compression')
const express = require('express')
const morgan = require('morgan')

const { PrefixTrie } = require('./search')

// ================================================================================================
// Configuration
// ================================================================================================

const isDevelopment = process.env.NODE_ENV === 'development'

const requiredConfig = ['RESULTS_DATA_DIRECTORY']
if (isDevelopment) {
  requiredConfig.push('BROWSER')
}
const missingConfig = requiredConfig.filter((option) => !process.env[option])
if (missingConfig.length) {
  throw Error(`Missing required environment variables: ${missingConfig.join(', ')}`)
}

const config = {
  dataDirectory: path.resolve(process.env.RESULTS_DATA_DIRECTORY),
  port: process.env.PORT || 8000,
  trustProxy: JSON.parse(process.env.TRUST_PROXY || 'false'),
}

// ================================================================================================
// Express app
// ================================================================================================

const app = express()
app.set('trust proxy', config.trustProxy)

app.use(compression())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ================================================================================================
// Kubernetes readiness probe
// ================================================================================================

// This must be registered before the HTTP => HTTPS redirect because it must return 200, not 30x.
app.use('/ready', (request, response) => {
  response.send('true')
})

// ================================================================================================
// Logging
// ================================================================================================

app.use(morgan(isDevelopment ? 'dev' : 'combined'))

// ================================================================================================
// Gene search
// ================================================================================================

const geneSearch = new PrefixTrie()

const indexGenes = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(config.dataDirectory, 'gene_search_terms.json.txt')),
      crlfDelay: Infinity,
    })

    rl.on('line', (line) => {
      const [geneId, searchTerms] = JSON.parse(line)
      for (const searchTerm of searchTerms) {
        geneSearch.add(searchTerm, geneId)
      }
    })

    rl.on('close', resolve)
  })
}

app.use('/api/search', (req, res) => {
  if (!req.query.q) {
    return res.status(400).json({ error: 'Query required' })
  }

  if (Array.isArray(req.query.q)) {
    return res.status(400).json({ error: 'One query required' })
  }

  const query = req.query.q.toUpperCase()

  let results
  if (query.match(/^ENSG\d{11}$/)) {
    results = [{ label: query, url: `/gene/${query}` }]
  } else {
    results = geneSearch
      .search(query)
      .flatMap(({ word, docs: geneIds }) => {
        if (geneIds.length > 1) {
          return geneIds.map((geneId) => ({
            label: `${word} (${geneId})`,
            url: `/gene/${geneId}`,
          }))
        }

        return [
          {
            label: word,
            url: `/gene/${geneIds[0]}`,
          },
        ]
      })
      .slice(0, 5)
  }

  return res.json({ results })
})

// ================================================================================================
// Authentication
// ================================================================================================

const PASSWORD_PROTECTED_DATASETS = ['IBD']
const CORRECT_PASSWORD = process.env.PROTECTED_PASSWORD || 'password'
const activeTokens = new Set()

app.post('/api/auth', (req, res) => {
  const { password } = req.body

  console.log('\n\n=== In auth!!')
  console.log('\nPassword is: ', password)
  console.log('\nActive tokens are: ', activeTokens)

  let dataset
  try {
    dataset = getDatasetForRequest(req)
  } catch (err) {} // eslint-disable-line no-empty

  if (!dataset) {
    res.status(500).json({ message: 'Unknown dataset' })
  }

  if (!PASSWORD_PROTECTED_DATASETS.includes(dataset)) {
    return res.json({ success: true, token: 'not-required' })
  }

  if (password === CORRECT_PASSWORD) {
    const token = Math.random().toString(36).substring(2, 15)
    activeTokens.add(token)

    console.log('Password correct, about to return true!')
    res.json({ success: true, token })
  } else {
    console.log('Sorry, incorrect password!')
    res.status(401).json({ success: false, message: 'Invalid password' })
  }
})

app.post('/api/check-auth', (req, res) => {
  const { token } = req.body

  let dataset
  try {
    dataset = getDatasetForRequest(req)
  } catch (err) {} // eslint-disable-line no-empty

  if (!dataset) {
    res.status(500).json({ message: 'Unknown dataset' })
  }

  if (!PASSWORD_PROTECTED_DATASETS.includes(dataset)) {
    return res.json({ authenticated: true })
  }

  if (token && activeTokens.has(token)) {
    res.json({ authenticated: true })
  } else {
    res.json({ authenticated: false })
  }
})

// ================================================================================================
// Dataset
// ================================================================================================

const metadata = JSON.parse(
  fs.readFileSync(path.join(config.dataDirectory, 'metadata.json'), { encoding: 'utf8' })
)

// In development, serve the browser specified by the BROWSER environment variable.
// In production, determine the browser/dataset to show based on the subdomain.
let getDatasetForRequest

if (isDevelopment) {
  const devDataset = Object.keys(metadata.datasets).find(
    (dataset) => dataset.toLowerCase() === process.env.BROWSER.toLowerCase()
  )
  getDatasetForRequest = () => devDataset
} else {
  // const datasetBySubdomain = Object.keys(metadata.datasets).reduce(
  //   (acc, dataset) => ({
  //     ...acc,
  //     [dataset.toLowerCase()]: dataset,
  //   }),
  //   {}
  // )
  // getDatasetForRequest = (req) => datasetBySubdomain[req.subdomains[0]]
  getDatasetForRequest = () => 'IBD'
}

// Store dataset on request object so other route handlers can use it.
app.use('/', (req, res, next) => {
  let dataset
  try {
    dataset = getDatasetForRequest(req)
  } catch (err) {} // eslint-disable-line no-empty

  if (!dataset) {
    res.status(500).json({ message: 'Unknown dataset' })
  }

  req.dataset = dataset

  if (!PASSWORD_PROTECTED_DATASETS.includes(dataset)) {
    return next()
  }

  const unauthenticatedPaths = ['/login', '/api/auth', '/api/check-auth', '/config.js']
  if (unauthenticatedPaths.includes(req.path) || req.path.startsWith('/static/')) {
    return next()
  }

  const authHeader = req.headers.authorization
  const queryToken = req.query.token

  let token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (queryToken) {
    token = queryToken
  }

  if (token && activeTokens.has(token)) {
    return next()
  }

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    })
  } else {
    return res.redirect('/login')
  }
})

const datasetConfig = {}
const getDatasetConfigJs = (dataset) => {
  if (!datasetConfig[dataset]) {
    const datasetMetadata = {
      datasetId: dataset,
      ...metadata,
      ...metadata.datasets[dataset],
    }
    datasetConfig[dataset] = `window.datasetConfig = ${JSON.stringify(datasetMetadata)}`
  }
  return datasetConfig[dataset]
}

app.use('/config.js', (req, res) => {
  res.type('text/javascript').send(getDatasetConfigJs(req.dataset))
})

// ================================================================================================
// File paths
// ================================================================================================

const geneDataDirectory = (geneId) => {
  const n = Number(geneId.replace(/^ENSGR?/, ''))
  const geneDataPath = path.join('genes', String(n % 1000).padStart(3, '0'))

  return geneDataPath
}

// ================================================================================================
// Gene results
// ================================================================================================

app.get('/api/results', (req, res) => {
  const resultsPath = path.join('results', `${req.dataset.toLowerCase()}.json`)

  return res.sendFile(resultsPath, { root: config.dataDirectory }, (err) => {
    if (err) {
      res.status(404).json({ error: 'Results not found' })
    }
  })
})

// ================================================================================================
// Gene
// ================================================================================================

app.get('/api/gene/:geneIdOrName', (req, res) => {
  const { geneIdOrName } = req.params

  let geneId
  if (geneIdOrName.match(/^ENSGR?\d+/)) {
    geneId = geneIdOrName
  } else {
    const geneIds = geneSearch.get(geneIdOrName.toUpperCase())
    if (geneIds === undefined || geneIds.length === 0) {
      return res.status(404).json({ error: 'Gene not found' })
    }
    if (geneIds.length > 1) {
      return res.status(400).json({ error: 'Gene symbol matches multiple genes' })
    }
    geneId = geneIds[0] // eslint-disable-line prefer-destructuring
  }

  const referenceGenome = metadata.datasets[req.dataset].reference_genome
  const genePath = path.join(geneDataDirectory(geneId), `${geneId}_${referenceGenome}.json`)

  return res.sendFile(genePath, { root: config.dataDirectory }, (err) => {
    if (err) {
      res.status(404).json({ error: 'Gene not found' })
    }
  })
})

// ================================================================================================
// Variants
// ================================================================================================

app.get('/api/gene/:geneIdOrName/variants', (req, res) => {
  const { geneIdOrName } = req.params

  let geneId
  if (geneIdOrName.match(/^ENSGR?\d+/)) {
    geneId = geneIdOrName
  } else {
    const geneIds = geneSearch.get(geneIdOrName.toUpperCase())
    if (geneIds.length === 1) {
      geneId = geneIds[0] // eslint-disable-line prefer-destructuring
    } else if (geneIds.length === 0) {
      return res.status(404).json({ error: 'Gene not found' })
    } else {
      return res.status(400).json({ error: 'Gene symbol matches multiple genes' })
    }
  }

  const variantsPath = path.join(
    geneDataDirectory(geneId),
    `${geneId}_${req.dataset.toLowerCase()}_variants.json`
  )

  return res.sendFile(variantsPath, { root: config.dataDirectory }, (err) => {
    if (err) {
      res.status(404).json({ error: 'Gene not found' })
    }
  })
})

// ================================================================================================
// API error handling
// ================================================================================================

// Return 404 for unknown API paths.
app.use('/api', (request, response) => {
  response.status(404).json({ error: 'not found' })
})

// ================================================================================================
// Static files
// ================================================================================================

// Serve static files from the appropriate dataset's directory.
app.use((req, res, next) => {
  req.url = `/${req.dataset}${req.url}`
  next()
}, express.static(path.join(__dirname, 'public')))

// Return index.html for unknown paths and let client side routing handle it.
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', req.dataset, 'index.html'))
})

// ================================================================================================
// Start
// ================================================================================================

indexGenes().then(() => {
  const server = app.listen(config.port)

  const shutdown = () => {
    server.close((err) => {
      if (err) {
        process.exitCode = 1
      }
      process.exit()
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
})
