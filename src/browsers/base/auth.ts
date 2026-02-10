const getCookie = (name: string) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts && parts.length === 2) {
    return parts.pop()!.split(';').shift()
  }
  return null
}

const userHasBearerCookie = (): boolean => {
  return !!getCookie('authToken')
}

const isLoggedIn = (): boolean => {
  const loggedIn = userHasBearerCookie()
  return loggedIn !== null && loggedIn !== false
}

const logout = (e: React.MouseEvent<HTMLElement>) => {
  e.preventDefault()
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  window.location.replace('/login')
}

const addAuthHeader = (options: any = {}) => {
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
