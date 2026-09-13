import '@testing-library/jest-dom'

import { buildWindowDatasetConfig } from './testUtils/buildWindowDatasetConfig'

window.datasetConfig = buildWindowDatasetConfig('SCHEMA')
