import PropTypes from 'prop-types'
import React from 'react'

import { ExternalLink, List, ListItem } from '@gnomad/ui'

import datasetConfig from '../datasetConfig'

import InfoPage from './InfoPage'

const otherDatasets = Object.keys(datasetConfig.datasets)
  .filter((d) => d !== datasetConfig.datasetId)
  .sort()

const downloadUrl = (datasetId, file) => {
  return `https://storage.googleapis.com/exome-results-browsers-public/${datasetId}/${datasetId}_${file}`
}

const DatasetDownloadLinks = ({ datasetId }) => {
  return (
    <List>
      <ListItem>
        <ExternalLink href={downloadUrl(datasetId, 'gene_results.tsv.bgz')}>
          {datasetId} gene results (TSV)
        </ExternalLink>
      </ListItem>
      <ListItem>
        <ExternalLink href={downloadUrl(datasetId, 'variant_results.tsv.bgz')}>
          {datasetId} variant results (TSV)
        </ExternalLink>
      </ListItem>
      <ListItem>
        <ExternalLink href={downloadUrl(datasetId, 'variant_results.vcf.bgz')}>
          {datasetId} variant results (VCF)
        </ExternalLink>
      </ListItem>
    </List>
  )
}

DatasetDownloadLinks.propTypes = {
  datasetId: PropTypes.string.isRequired,
}

export default () => (
  <InfoPage title="Downloads">
    <DatasetDownloadLinks datasetId={datasetConfig.datasetId} />

    <h2>Other Studies</h2>
    {otherDatasets.map((otherDatasetId) => {
      return (
        <React.Fragment key={otherDatasetId}>
          <h3>{otherDatasetId}</h3>
          <DatasetDownloadLinks datasetId={otherDatasetId} />
        </React.Fragment>
      )
    })}
  </InfoPage>
)
