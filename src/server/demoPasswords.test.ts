import getDemoPasswords from './demoPasswords'

describe('demo passwords', () => {
  it.each(['ascdemo', 'agbdemo'])('accepts %s from the password list', (password) => {
    expect(getDemoPasswords('ascdemo,agbdemo', undefined)).toContain(password)
  })

  it('trims entries and removes quotes retained by the development launcher', () => {
    expect(getDemoPasswords(' "ascdemo, agbdemo" ', undefined)).toEqual(['ascdemo', 'agbdemo'])
  })

  it('ignores empty entries without accepting an empty password', () => {
    expect(getDemoPasswords(',ascdemo, ,agbdemo,', undefined)).toEqual(['ascdemo', 'agbdemo'])
  })

  it.each(['', 'incorrect', 'ASCDEMO', 'ascdemo,agbdemo', 'legacy', 'password'])(
    'rejects unlisted password=%s',
    (password) => {
      expect(getDemoPasswords('ascdemo,agbdemo', 'legacy')).not.toContain(password)
    }
  )

  it.each([undefined, '', ' , ', '""'])('falls back to DEMO_PASSWORD for list=%s', (list) => {
    expect(getDemoPasswords(list, 'ascdemo')).toEqual(['ascdemo'])
  })

  it('removes outer quotes from the legacy password', () => {
    expect(getDemoPasswords(undefined, '"ascdemo"')).toEqual(['ascdemo'])
  })

  it('preserves commas and spaces in the legacy single password', () => {
    expect(getDemoPasswords(undefined, ' asc,demo ')).toEqual([' asc,demo '])
  })

  it.each([undefined, '', '""'])('preserves the default for legacy password=%s', (password) => {
    expect(getDemoPasswords(undefined, password)).toEqual(['password'])
  })
})
