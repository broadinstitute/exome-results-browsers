import React, { useState } from 'react'

import { Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from './DocumentTitle'

const LoginPage = () => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          localStorage.setItem('authToken', data.token)
          window.location.replace('/')
        } else {
          setError(data.message || 'Login failed. Please try again.')
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Login error:', err)
        setError('An error occurred. Please try again.')
        setLoading(false)
      })
  }

  return (
    <Page>
      <DocumentTitle title="Login" />
      <PageHeading>Login</PageHeading>
      <div>
        <p>Please enter the password to view this browser.</p>

        {error && (
          <div
            style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
              }}
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#7b558c',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </Page>
  )
}

export default LoginPage
