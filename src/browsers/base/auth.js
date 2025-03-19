const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop().split(';').shift()
  }
  return null
}

const isLoggedIn = () => {
  const loggedIn = userHasBearerCookie()
  return loggedIn !== null
}

const userHasBearerCookie = () => {
  return !!getCookie('authToken')
}

const logout = (e) => {
  e.preventDefault()
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  window.location.replace('/login')
}

const addAuthHeader = (options = {}) => {
  const token = localStorage.getItem('authToken')
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

export { isLoggedIn, addAuthHeader, logout, userHasBearerCookie }
