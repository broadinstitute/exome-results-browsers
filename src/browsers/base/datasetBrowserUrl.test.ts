import getDatasetBrowserUrl from './datasetBrowserUrl'

describe('dataset browser URLs', () => {
  it.each([
    ['https://schema.the-tgg.dev', 'https://agb.the-tgg.dev/'],
    ['https://schema.broadinstitute.org', 'https://agb.broadinstitute.org/'],
    ['http://schema.the-tgg.dev:8080', 'http://agb.the-tgg.dev:8080/'],
    ['https://schema.demo.the-tgg.dev', 'https://agb.demo.the-tgg.dev/'],
  ])('preserves the environment of %s', (origin, expected) => {
    expect(getDatasetBrowserUrl('AGB', '/', origin)).toBe(expected)
  })

  it.each(['/results', '/gene/CHD8', '/about', '/terms', '/gene/CHD8?query=a%2Fb#details'])(
    'preserves destination path %s',
    (path) => {
      expect(getDatasetBrowserUrl('AGB', path, 'https://schema.the-tgg.dev')).toBe(
        `https://agb.the-tgg.dev${path}`
      )
    }
  )

  it('uses the IBD subdomain override', () => {
    expect(getDatasetBrowserUrl('IBD', '/gene/CHD8', 'https://schema.the-tgg.dev')).toBe(
      'https://ibdseq.the-tgg.dev/gene/CHD8'
    )
  })

  it('supports navigation from the IBD hostname', () => {
    expect(getDatasetBrowserUrl('SCHEMA', '/results', 'https://ibdseq.the-tgg.dev')).toBe(
      'https://schema.the-tgg.dev/results'
    )
  })

  it('uses the current window origin by default', () => {
    expect(getDatasetBrowserUrl('AGB')).toBe('http://agb.localhost/')
  })
})
