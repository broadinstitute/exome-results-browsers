import { fetchApi } from './Fetch'
import { fetchSearchResults } from './Searchbox'

const payload = {
  gene: { symbol: 'GENE1' },
  results: [{ label: 'GENE1', url: '/gene/GENE1' }],
}
const requestCases = [
  {
    label: 'data',
    request: () => fetchApi('/gene/GENE1'),
    errorMessage: 'Unable to load data',
    expectedData: payload,
  },
  {
    label: 'search',
    request: () => fetchSearchResults('GENE1'),
    errorMessage: 'Search failed',
    expectedData: [{ label: 'GENE1', value: '/gene/GENE1' }],
  },
]

const originalFetch = global.fetch
const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location')
const redirectToLogin = jest.fn()
const fetchMock = jest.fn()

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, replace: redirectToLogin },
  })
})

beforeEach(() => {
  global.fetch = fetchMock
  fetchMock.mockReset()
  redirectToLogin.mockReset()
  document.cookie = 'authToken=stale-token; path=/;'
})

afterEach(() => {
  global.fetch = originalFetch
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
})

afterAll(() => {
  if (originalLocationDescriptor) {
    Object.defineProperty(window, 'location', originalLocationDescriptor)
  }
})

describe.each(requestCases)('$label requests', ({ request, errorMessage, expectedData }) => {
  it('clears a rejected auth cookie and redirects to login on 401 without parsing the body', async () => {
    const json = jest.fn()
    fetchMock.mockResolvedValue({ status: 401, ok: false, json })

    await expect(request()).rejects.toThrow('Authentication required')

    expect(document.cookie).not.toContain('authToken=')
    expect(redirectToLogin).toHaveBeenCalledWith('/login')
    expect(json).not.toHaveBeenCalled()
  })

  it.each([403, 404, 500])(
    'keeps the session on HTTP %s and reports the request error',
    async (status) => {
      fetchMock.mockResolvedValue({ status, ok: false, json: jest.fn().mockResolvedValue({}) })

      await expect(request()).rejects.toThrow(errorMessage)

      expect(document.cookie).toContain('authToken=stale-token')
      expect(redirectToLogin).not.toHaveBeenCalled()
    }
  )

  it('keeps the session and returns successful results', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: jest.fn().mockResolvedValue(payload),
    })

    await expect(request()).resolves.toEqual(expectedData)

    expect(document.cookie).toContain('authToken=stale-token')
    expect(redirectToLogin).not.toHaveBeenCalled()
  })

  it('keeps the session on network failures', async () => {
    fetchMock.mockRejectedValue(new Error('Network unavailable'))

    await expect(request()).rejects.toThrow('Network unavailable')

    expect(document.cookie).toContain('authToken=stale-token')
    expect(redirectToLogin).not.toHaveBeenCalled()
  })

  it('keeps the session on malformed non-401 responses', async () => {
    fetchMock.mockResolvedValue({
      status: 500,
      ok: false,
      json: jest.fn().mockRejectedValue(new Error('Malformed response')),
    })

    await expect(request()).rejects.toThrow()

    expect(document.cookie).toContain('authToken=stale-token')
    expect(redirectToLogin).not.toHaveBeenCalled()
  })
})
