import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import datasetConfig from '../datasetConfig'
import OtherStudies from './OtherStudies'

const originalDatasetId = datasetConfig.datasetId

afterEach(() => {
  datasetConfig.datasetId = originalDatasetId
})

const renderOtherStudies = (path: string) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <OtherStudies />
    </MemoryRouter>
  )
}

describe('other study browser links', () => {
  it.each([
    ['/', 'Open AGB browser', ''],
    ['/results', 'View results in AGB browser', '/results'],
  ])('links to AGB from %s', (path, label, targetPath) => {
    datasetConfig.datasetId = 'SCHEMA'
    renderOtherStudies(path)

    expect(screen.getByRole('link', { name: label })).toHaveAttribute(
      'href',
      `https://agb.broadinstitute.org${targetPath}`
    )
    expect(screen.queryByRole('link', { name: /ASC/ })).not.toBeInTheDocument()
  })

  it('omits the current AGB browser', () => {
    datasetConfig.datasetId = 'AGB'
    renderOtherStudies('/')

    expect(screen.queryByRole('link', { name: /AGB|ASC/ })).not.toBeInTheDocument()
  })
})
