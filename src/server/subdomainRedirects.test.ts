import { getSubdomainRedirectUrl } from './subdomainRedirects'

describe('subdomain redirect URLs', () => {
  it.each([
    ['asc.broadinstitute.org', '/', 'https://agb.broadinstitute.org/'],
    ['asc.example.org', '/results', 'https://agb.example.org/results'],
    ['ASC.example.org', '/login', 'https://agb.example.org/login'],
    ['asc.demo.example.org', '/', 'https://agb.demo.example.org/'],
    [
      'asc.example.org',
      '/gene/ENSG00000169174?query=a%2Fb&query=c',
      'https://agb.example.org/gene/ENSG00000169174?query=a%2Fb&query=c',
    ],
    [
      'asc.example.org',
      '//other.example.org/path',
      'https://agb.example.org//other.example.org/path',
    ],
  ])('redirects %s%s', (hostname, path, target) => {
    expect(getSubdomainRedirectUrl(hostname, path)).toBe(target)
  })

  it.each([
    'agb.example.org',
    'ibdseq.example.org',
    'schema.example.org',
    'localhost',
    'asc',
    'notasc.example.org',
    'example.asc.org',
    'constructor.example.org',
    'toString.example.org',
    '__proto__.example.org',
  ])('does not redirect unmapped hostname %s', (hostname) => {
    expect(getSubdomainRedirectUrl(hostname, '/')).toBeUndefined()
  })

  it('supports additional redirects through map entries alone', () => {
    const redirects = { asc: 'agb', old: 'new' }

    expect(getSubdomainRedirectUrl('asc.example.org', '/', redirects)).toBe(
      'https://agb.example.org/'
    )
    expect(getSubdomainRedirectUrl('old.example.org', '/results?q=gene', redirects)).toBe(
      'https://new.example.org/results?q=gene'
    )
  })

  it('avoids redirecting a subdomain to itself', () => {
    expect(getSubdomainRedirectUrl('agb.example.org', '/', { agb: 'agb' })).toBeUndefined()
  })
})
