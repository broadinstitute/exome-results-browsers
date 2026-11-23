#!/usr/bin/env node
/* eslint-disable no-console */
// Usage: node scripts/build-e2e-fixture.js [SOURCE_DIR] [OUTPUT_DIR]
const fs = require('fs')
const path = require('path')

const VARIANTS_PER_FILE = 100

const sourceDirectory = path.resolve(process.argv[2] || 'data/smoke')
const outputDirectory = path.resolve(process.argv[3] || 'e2e/fixtures/results')

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value))
}

const copyFile = (relativePath) => {
  const destination = path.join(outputDirectory, relativePath)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(path.join(sourceDirectory, relativePath), destination)
}

const copyGeneFiles = () => {
  const geneIds = new Set()
  const genesDirectory = path.join(sourceDirectory, 'genes')
  fs.readdirSync(genesDirectory).forEach((shard) => {
    fs.readdirSync(path.join(genesDirectory, shard)).forEach((fileName) => {
      const relativePath = path.join('genes', shard, fileName)
      geneIds.add(fileName.split('_')[0])
      if (fileName.endsWith('_variants.json')) {
        const { variants } = JSON.parse(fs.readFileSync(path.join(sourceDirectory, relativePath)))
        writeJson(path.join(outputDirectory, relativePath), {
          variants: variants.slice(0, VARIANTS_PER_FILE),
        })
      } else {
        copyFile(relativePath)
      }
    })
  })
  return geneIds
}

const writeGeneSearchTerms = (geneIds) => {
  const fileName = 'gene_search_terms.json.txt'
  const lines = fs
    .readFileSync(path.join(sourceDirectory, fileName), 'utf8')
    .split('\n')
    .filter((line) => line && geneIds.has(JSON.parse(line)[0]))
  fs.writeFileSync(path.join(outputDirectory, fileName), `${lines.join('\n')}\n`)
}

const main = () => {
  fs.rmSync(outputDirectory, { recursive: true, force: true })
  copyFile('metadata.json')
  fs.readdirSync(path.join(sourceDirectory, 'results')).forEach((fileName) =>
    copyFile(path.join('results', fileName))
  )
  const geneIds = copyGeneFiles()
  writeGeneSearchTerms(geneIds)
  console.log(`Wrote fixture for ${[...geneIds].join(', ')} to ${outputDirectory}`)
}

main()
