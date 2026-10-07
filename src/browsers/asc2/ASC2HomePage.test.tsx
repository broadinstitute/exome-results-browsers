import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'

import HomePage from './ASC2HomePage'
import AgbLogo from './content/agb_logo.png'

const renderHomePage = () => {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  )
}

describe('ASC2 Home page', () => {
  it('displays the AGB title, new logo, release date, and reference genome', () => {
    renderHomePage()

    expect(document.title).toBe('AGB: Autism Genomics Browser')
    expect(screen.getByRole('heading', { name: 'The Autism Genomics Browser' })).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.getByRole('img', { name: 'Autism Genomics Browser logo' })).toHaveAttribute(
      'src',
      AgbLogo
    )
    expect(screen.getByText(/October 2026/)).toHaveTextContent('Release: October 2026')
    expect(screen.getByText(/GRCh38/)).toHaveTextContent('Reference genome: GRCh38')
  })

  it('retains the search component and example destinations', () => {
    renderHomePage()

    expect(screen.getByPlaceholderText('Search results by gene')).toHaveAttribute(
      'id',
      'asc-search'
    )
    expect(screen.getByRole('heading', { name: 'Example' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'SHANK3' })).toHaveAttribute(
      'href',
      '/gene/ENSG00000251322'
    )
    expect(screen.getByRole('link', { name: 'ENSG00000251322' })).toHaveAttribute(
      'href',
      '/gene/ENSG00000251322'
    )
    expect(screen.getByRole('link', { name: 'all results' })).toHaveAttribute('href', '/results')
  })

  it('displays the cross-consortia description and participant counts', () => {
    renderHomePage()

    expect(screen.getByRole('heading', { name: 'The data' })).toBeInTheDocument()
    const description = screen.getByText(/cross-consortia autism genomics data aggregation/)
    expect(description).toHaveTextContent('62,429 individuals with recorded autism')
    expect(description).toHaveTextContent('38,680 probands and 23,749 cases')
    expect(description).toHaveTextContent('33,316 individuals without recorded autism')
    expect(description).toHaveTextContent('9,567 siblings and 23,749 controls')
    expect(
      screen.getByRole('link', { name: 'Satterstrom, Auwerx, Fu et al., 2026' })
    ).toHaveAttribute('href', 'https://www.medrxiv.org/content/10.64898/2026.08.24.26360398v1')
    expect(screen.getByRole('link', { name: 'GeneDx' })).toHaveAttribute(
      'href',
      'https://www.genedx.com/'
    )
    expect(screen.getByRole('link', { name: 'iPSYCH' })).toHaveAttribute(
      'href',
      'https://ipsych.dk/en/about-ipsych'
    )
    expect(screen.getByRole('link', { name: 'here' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'terms of use' })).toHaveAttribute('href', '/terms')
  })
})
