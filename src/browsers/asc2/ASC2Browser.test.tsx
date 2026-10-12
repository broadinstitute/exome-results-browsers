import { render } from '@testing-library/react'
import React from 'react'

import Browser from '../base/Browser'

import ASC2Browser from './ASC2Browser'

jest.mock('../base/Browser', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock('./ASC2WaterfallPlot', () => ({
  __esModule: true,
  default: () => null,
}))

const getGeneResultColumns = () => {
  jest.mocked(Browser).mockClear()
  render(<ASC2Browser />)
  return jest.mocked(Browser).mock.calls[0][0].geneResultColumns ?? []
}

const getGeneResultColumn = (key: string) => {
  const column = getGeneResultColumns().find((candidate) => candidate.key === key)
  if (!column) {
    throw new Error(`Missing ASC2 gene result column: ${key}`)
  }
  return column
}

describe('ASC2 all-genes table', () => {
  it.each<[string, number | boolean, string]>([
    ['bayes_factor', 123, '123.00'],
    ['false_discovery_rate', 0.05, '5.00e-2'],
    ['qc_flagged', true, 'Flag'],
  ])('centers the content of %s', (key, value, text) => {
    const column = getGeneResultColumn(key)
    const { container, getByText } = render(<>{column.render?.(value)}</>)

    expect(getByText(text)).toBeInTheDocument()
    expect(container.firstChild).toHaveStyle('display: flex; width: 100%; justify-content: center;')
    if (key !== 'qc_flagged') {
      expect(getByText(text)).toHaveStyle('padding-right: 0; text-align: center;')
    }
  })

  it.each([false, null, undefined])('leaves the flag empty for %s', (value) => {
    const column = getGeneResultColumn('qc_flagged')
    const { container } = render(<>{column.render?.(value)}</>)

    expect(container.textContent).toBe('')
  })

  it.each(['deNovo', 'transmittedUntransmitted', 'caseControl'])(
    'keeps only the analysis variant classes in the %s group',
    (groupKey) => {
      const columns = getGeneResultColumns().filter((column) => column.group?.key === groupKey)

      expect(columns).toHaveLength(10)
      expect(columns.map((column) => column.key)).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/_(mis0|syn)_/)])
      )
      for (const suffix of ['ptv', 'mis2', 'mis1', 'del', 'dup']) {
        expect(columns.filter((column) => column.key.includes(`${suffix}_`))).toHaveLength(2)
      }
    }
  )
})
