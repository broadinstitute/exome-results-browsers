import React from 'react'

// @ts-expect-error: no types in this @gnomad/ui version
import { ExternalLink, List, ListItem } from '@gnomad/ui'

import datasetConfig from '../datasetConfig'

import InfoPage from './InfoPage'
import { DatasetId } from './Browser'

const BASE_GCS_DOWNLOAD_PATH = 'https://storage.googleapis.com/exome-results-browsers-public/downloads'
const BASE_AWS_DOWNLOAD_PATH = 'https://atgu-exome-browser-data.s3.amazonaws.com'

type LegacyDatasetId = 'SCHEMA_v1'
type DownloadDatasetId = DatasetId | LegacyDatasetId

type DownloadConfig = {
  baseUrl: string;
  filePrefix: string
}


const DOWNLOAD_URLS: Partial<Record<DownloadDatasetId, DownloadConfig>> = {
  ASC: { baseUrl: `${BASE_AWS_DOWNLOAD_PATH}/ASC`, filePrefix: 'ASC' },
  BipEx2: { baseUrl: `${BASE_GCS_DOWNLOAD_PATH}/2026-04-24/BipEx2`, filePrefix: 'BipEx2' },
  Epi25: { baseUrl: `${BASE_GCS_DOWNLOAD_PATH}/2022-12-01/Epi25`, filePrefix: 'Epi25' },
  SCHEMA: { baseUrl: `${BASE_GCS_DOWNLOAD_PATH}/2026-08-07/SCHEMA`, filePrefix: 'SCHEMA' },
  //
  SCHEMA_v1: { baseUrl: `${BASE_AWS_DOWNLOAD_PATH}/SCHEMA`, filePrefix: 'SCHEMA' },
}

const otherDatasets = (Object.keys(datasetConfig.datasets) as DatasetId[])
  .filter((d) => d !== datasetConfig.datasetId)
  .sort()

const downloadUrl = (datasetId: DownloadDatasetId, file: string) => {
  if (DOWNLOAD_URLS[datasetId]) {
    const { baseUrl, filePrefix } = DOWNLOAD_URLS[datasetId]
    return `${baseUrl}/${filePrefix}_${file}`
  }

  return `${BASE_AWS_DOWNLOAD_PATH}/${datasetId}/${datasetId}_${file}`
}

type DatasetDownloadLinksProps = {
  datasetId: DownloadDatasetId
  label: string
}

const DatasetDownloadLinkList = ({ datasetId, label }: DatasetDownloadLinksProps) => {
  return (
    <List>
      <ListItem>
        <ExternalLink href={downloadUrl(datasetId, 'gene_results.tsv.bgz')}>
          {label} gene results (TSV)
        </ExternalLink>
      </ListItem>
      <ListItem>
        <ExternalLink href={downloadUrl(datasetId, 'variant_results.tsv.bgz')}>
          {label} variant results (TSV)
        </ExternalLink>
      </ListItem>
      <ListItem>
        <ExternalLink href={downloadUrl(datasetId, 'variant_results.vcf.bgz')}>
          {label} variant results (VCF)
        </ExternalLink>
      </ListItem>
    </List>
  )
}

type DatasetDownloadsProps = {
  datasetId: DatasetId
  isMainDataset?: boolean
}

const DatasetDownloads = ({ datasetId, isMainDataset = false }: DatasetDownloadsProps) => {
  return (
    <>
      <DatasetDownloadLinkList datasetId={datasetId} label={datasetId} />

      {isMainDataset && datasetId === 'SCHEMA' && (
        <>
          <h3 style={{ marginBottom: '0.5rem' }}>Previous SCHEMA release data downloads</h3>
          <p style={{ marginTop: '0rem' }}>
            The prior SCHEMA analysis and dataset was released September 10th, 2020.
          </p>
          <DatasetDownloadLinkList datasetId={'SCHEMA_v1'} label="SCHEMA" />
        </>
      )}
    </>
  )
}

export default () => {
  const datasetsWithoutDownloads: DatasetId[] = ['GP2', 'IBD']
  return (
    <InfoPage title="Downloads">
      <DatasetDownloads datasetId={datasetConfig.datasetId} isMainDataset={true} />

      <h2>Other Studies</h2>
      {otherDatasets
        .filter((otherDatasetId) => !datasetsWithoutDownloads.includes(otherDatasetId))
        .map((otherDatasetId) => {
          return (
            <React.Fragment key={otherDatasetId}>
              <h3>{otherDatasetId}</h3>
              <DatasetDownloads datasetId={datasetConfig.datasetId} isMainDataset={false} />
            </React.Fragment>
          )
        })}
    </InfoPage>
  )
}
