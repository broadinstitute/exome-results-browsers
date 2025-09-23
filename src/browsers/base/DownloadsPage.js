import PropTypes from 'prop-types'
import React from 'react'

import { ExternalLink, List, ListItem } from '@gnomad/ui'

import datasetConfig from '../datasetConfig'

import InfoPage from './InfoPage'

const otherDatasets = Object.keys(datasetConfig.datasets)
  .filter((d) => d !== datasetConfig.datasetId)
  .sort()

const downloadUrl = (datasetId, file) => {
  if (datasetId === 'Epi25') {
    return `https://storage.googleapis.com/exome-results-browsers-public/downloads/2022-12-01/${datasetId}/${datasetId}_${file}`
  }
  return `https://atgu-exome-browser-data.s3.amazonaws.com/${datasetId}/${datasetId}_${file}`
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

export default () => {
  const datasetsWithoutDownloads = ['GP2', 'IBD']
  return (
    <InfoPage title="Downloads">
      <DatasetDownloadLinks datasetId={datasetConfig.datasetId} />

      <h2>Other Studies</h2>
      {otherDatasets
        .filter((otherDatasetId) => !datasetsWithoutDownloads.includes(otherDatasetId))
        .map((otherDatasetId) => {
          return (
            <React.Fragment key={otherDatasetId}>
              <h3>{otherDatasetId}</h3>
              <DatasetDownloadLinks datasetId={otherDatasetId} />
            </React.Fragment>
          )
        })}
    </InfoPage>
  )
}
