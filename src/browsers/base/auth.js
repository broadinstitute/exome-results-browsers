const isLoggedIn = () => {
  const isLoggedIn = sessionStorage.getItem('authToken')
  console.log('Running isLoggedIn, isLoggedIn? ', isLoggedIn)
  return isLoggedIn !== null
}

const login = (password) => {
  return fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.token) {
        sessionStorage.setItem('authToken', data.token)
        return true
      }
      return false
    })
    .catch((err) => {
      console.error('Login error:', err)
      return false
    })
}

const handleLogout = (e) => {
  e.preventDefault()
  sessionStorage.removeItem('authToken')
  window.location.replace('/login')
}

const addAuthHeader = (options = {}) => {
  const token = sessionStorage.getItem('authToken')
  if (token) {
    return {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    }
  }
  return options
}

export { isLoggedIn, login, addAuthHeader, handleLogout }
