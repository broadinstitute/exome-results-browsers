import { formatCell } from './CSVExportButton'

describe('formatCell', () => {
  it('renders null and undefined as an empty cell', () => {
    expect(formatCell(null)).toBe('')
    expect(formatCell(undefined)).toBe('')
  })

  it('renders numbers as-is', () => {
    expect(formatCell(3.5)).toBe('3.5')
  })

  it('renders booleans as strings instead of throwing', () => {
    expect(formatCell(true)).toBe('true')
    expect(formatCell(false)).toBe('false')
  })

  it('quotes and escapes a string value containing a comma or quote', () => {
    expect(formatCell('a,b')).toBe('"a,b"')
    expect(formatCell('a"b')).toBe('"a""b"')
  })

  it('leaves a plain string value unquoted', () => {
    expect(formatCell('plain')).toBe('plain')
  })
})
