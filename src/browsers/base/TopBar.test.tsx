import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter } from 'react-router-dom'

import { buildWindowDatasetConfig } from '../testUtils/buildWindowDatasetConfig'
import TopBar from './TopBar'

jest.mock('./Searchbox', () => ({
  __esModule: true,
  default: () => {
    return null
  },
}))

const originalDatasetConfig = window.datasetConfig

beforeEach(() => {
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  window.datasetConfig = buildWindowDatasetConfig('AGB')
})

afterEach(() => {
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  window.datasetConfig = originalDatasetConfig
})

const renderTopBar = (path: string) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TopBar title="Demo browser" passwordProtectedDatasets={['AGB']} />
      <Link to="/login">Open login</Link>
    </MemoryRouter>
  )
}

describe('TopBar on authentication pages', () => {
  it.each([false, true])(
    'hides the protected dataset header on /login with cookie=%s',
    (hasCookie) => {
      if (hasCookie) {
        document.cookie = 'authToken=invalid-token; path=/;'
      }

      renderTopBar('/login')

      expect(screen.queryByRole('link', { name: 'Demo browser' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Results' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Logout' })).not.toBeInTheDocument()
    }
  )

  it('keeps the protected dataset header hidden without a cookie on other routes', () => {
    renderTopBar('/gene/GENE1')

    expect(screen.queryByRole('link', { name: 'Demo browser' })).not.toBeInTheDocument()
  })

  it('shows the header on other routes with a cookie and hides it on navigation to /login', () => {
    document.cookie = 'authToken=existing-token; path=/;'
    renderTopBar('/gene/GENE1')

    expect(screen.getByRole('link', { name: 'Demo browser' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Logout' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Open login' }))

    expect(screen.queryByRole('link', { name: 'Demo browser' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Logout' })).not.toBeInTheDocument()
    expect(document.cookie).toContain('authToken=existing-token')
  })

  it('keeps the public dataset header visible on /login', () => {
    window.datasetConfig = buildWindowDatasetConfig('SCHEMA')
    renderTopBar('/login')

    expect(screen.getByRole('link', { name: 'Demo browser' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Results' })).toBeInTheDocument()
  })
})
