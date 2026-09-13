import '@testing-library/jest-dom'
import 'jest-canvas-mock'

import { buildWindowDatasetConfig } from './testUtils/buildWindowDatasetConfig'

window.datasetConfig = buildWindowDatasetConfig('SCHEMA')
