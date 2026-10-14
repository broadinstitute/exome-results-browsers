import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import LoginPage from './LoginPage'
import { logout } from './auth'

jest.mock('./auth', () => ({
  ...jest.requireActual('./auth'),
  logout: jest.fn(),
}))

beforeEach(() => {
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  jest.clearAllMocks()
})

afterEach(() => {
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
})

const renderLoginPage = () => {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('browser sign-in page', () => {
  it('shows the password form when there is no sign-in cookie', () => {
    renderLoginPage()

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByText('Please enter the password to view this browser.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it('explains a saved sign-in and offers navigation in a padded page', () => {
    document.cookie = 'authToken=saved-token; path=/;'
    renderLoginPage()

    const heading = screen.getByRole('heading', { name: 'Browser sign-in' })
    expect(heading.parentElement?.parentElement).toHaveStyle('padding: 0 15px')
    expect(document.title).toBe('Browser sign-in')
    expect(screen.getByText('Your browser has a saved sign-in.')).toBeInTheDocument()
    expect(screen.getByText(/If your sign-in has expired/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue to browser' })).toHaveAttribute('href', '/')
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
