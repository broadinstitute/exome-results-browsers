import React from 'react'

// @ts-expect-error: no types in this @gnomad/ui version
import { ExternalLink, List, ListItem } from '@gnomad/ui'

import datasetConfig from '../datasetConfig'

import InfoPage from './InfoPage'
import { DatasetId } from './Browser'

const otherDatasets = (Object.keys(datasetConfig.datasets) as DatasetId[])
  .filter((d) => d !== datasetConfig.datasetId)
  .sort()

const downloadUrl = (datasetId: DatasetId, file: string) => {
  if (datasetId === 'Epi25') {
    return `https://storage.googleapis.com/exome-results-browsers-public/downloads/2022-12-01/Epi25/Epi25_${file}`
  } else if (datasetId === 'BipEx2') {
    return `https://storage.googleapis.com/exome-results-browsers-public/downloads/2026-04-14/BipEx2/BipEx2_${file}`
  } else if (datasetId === 'SCHEMA2') {
    return `https://storage.googleapis.com/exome-results-browsers-public/downloads/2026-04-23/SCHEMA2/SCHEMA2_${file}`
  }

  return `https://atgu-exome-browser-data.s3.amazonaws.com/${datasetId}/${datasetId}_${file}`
}

type DatasetDownloadLinksProps = {
  datasetId: DatasetId
}

const DatasetDownloadLinks = ({ datasetId }: DatasetDownloadLinksProps) => {
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

export default () => {
  const datasetsWithoutDownloads: DatasetId[] = ['GP2', 'IBD']
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
