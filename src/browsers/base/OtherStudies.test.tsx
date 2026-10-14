/** @jest-environment-options {"url":"https://schema.the-tgg.dev/"} */

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
    ['/', 'Open AGB browser', '/'],
    ['/results', 'View results in AGB browser', '/results'],
  ])('links to AGB from %s', (path, label, targetPath) => {
    datasetConfig.datasetId = 'SCHEMA'
    renderOtherStudies(path)

    expect(screen.getByRole('link', { name: label })).toHaveAttribute(
      'href',
      `https://agb.the-tgg.dev${targetPath}`
    )
    expect(screen.queryByRole('link', { name: 'ASC' })).not.toBeInTheDocument()
  })

  it('keeps the AGB description links in the current environment', () => {
    datasetConfig.datasetId = 'SCHEMA'
    renderOtherStudies('/')

    expect(screen.getByRole('link', { name: 'AGB' })).toHaveAttribute(
      'href',
      'https://agb.the-tgg.dev/'
    )
    expect(screen.getByRole('link', { name: 'here' })).toHaveAttribute(
      'href',
      'https://agb.the-tgg.dev/about'
    )
    expect(screen.getByRole('link', { name: 'terms of use' })).toHaveAttribute(
      'href',
      'https://agb.the-tgg.dev/terms'
    )
    expect(screen.getByRole('link', { name: 'IBD' })).toHaveAttribute(
      'href',
      'https://ibdseq.the-tgg.dev/'
    )
  })

  it('omits the current AGB browser', () => {
    datasetConfig.datasetId = 'AGB'
    renderOtherStudies('/')

    expect(screen.queryByRole('link', { name: /AGB|ASC/ })).not.toBeInTheDocument()
  })
})
