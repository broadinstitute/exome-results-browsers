import type { DatasetId } from './Browser'

const DATASET_SUBDOMAIN_OVERRIDES: Partial<Record<DatasetId, string>> = {
  IBD: 'ibdseq',
}

const getDatasetBrowserUrl = (
  datasetId: DatasetId,
  path = '/',
  currentOrigin = window.location.origin
): string => {
  const origin = new URL(currentOrigin)
  const subdomain = DATASET_SUBDOMAIN_OVERRIDES[datasetId] ?? datasetId.toLowerCase()
  const domain = origin.hostname.slice(origin.hostname.indexOf('.') + 1)
  origin.hostname = `${subdomain}.${domain}`

  return new URL(path, origin).href
}

export default getDatasetBrowserUrl
