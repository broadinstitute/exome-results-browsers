import React, { useState } from 'react'
import styled from 'styled-components'

import { Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from './DocumentTitle'

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
`

const FormGroup = styled.div`
  margin-bottom: 1rem;
`

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
`

const Input = styled.input`
  width: 100%;
  max-width: 300px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
`

const Button = styled.button`
  background-color: ${(props) => (props.variant === 'logout' ? '#e6004c' : '#7b558c')};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};
  ${(props) => props.variant === 'logout' && 'margin-left: 20px;'}
`

const Form = styled.form`
  margin-bottom: 2rem;
`

const LoginPage = () => {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e) => {
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
          sessionStorage.setItem('authToken', data.token)
          window.location.replace('/')
        } else {
          setError(data.message || 'Login failed. Please try again.')
          setLoading(false)
        }
      })
      .catch((err) => {
        setError('An error occurred. Please try again.')
        setLoading(false)
      })
  }

  const handleLogout = (e) => {
    e.preventDefault()
    sessionStorage.removeItem('authToken')
    window.location.replace('/login')
  }

  if (sessionStorage.authToken) {
    return (
      <>
        <Button type="button" onClick={handleLogout} variant="logout" disabled={loading}>
          Logout
        </Button>
      </>
    )
  }

  return (
    <Page>
      <DocumentTitle title="Login" />
      <PageHeading>Login</PageHeading>
      <div>
        <p>Please enter the password to view this browser.</p>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleLogin}>
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </FormGroup>
          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Form>
      </div>
    </Page>
  )
}

export default LoginPage
