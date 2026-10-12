import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { VariantColumnConfig } from '../Browser'
import VariantTable from './VariantTable'
import VariantTableGroupHeadings from './VariantTableGroupHeadings'
import getVariantTableColumns, { VariantRow, VariantTableColumn } from './variantTableColumns'

const deNovoGroup = { key: 'deNovo', geneTableLabel: 'De novo', variantTableLabel: 'De novo AC' }
const caseControlGroup = {
  key: 'caseControl',
  geneTableLabel: 'Case-Control',
  variantTableLabel: 'Case-Control AC',
}
const configuration: VariantColumnConfig[] = [
  { key: 'info.description', heading: 'Description' },
  { key: 'info.proband', heading: 'Proband', group: deNovoGroup },
  { key: 'info.sibling', heading: 'Sibling', group: deNovoGroup },
  { key: 'info.case', heading: 'Case', group: caseControlGroup },
  { key: 'info.control', heading: 'Control', group: caseControlGroup },
]
const columns = getVariantTableColumns({
  datasetId: 'ASC2',
  variantResultColumns: configuration,
  filter: {
    includeCategories: { lof: true, missense: true, synonymous: true, other: true },
    searchText: '',
    custom: undefined,
  },
}).filter((column) => configuration.some((configured) => configured.key === column.key))
const variant: VariantRow = {
  variant_id: '1-100-A-T',
  pos: 100,
  consequence: 'missense',
  consequenceCategory: 'missense',
  hgvsp: '',
  hgvsc: '',
  group_results: {},
  info: { description: 1, proband: 2, sibling: 3, case: 4, control: 5 },
}
const table = (visibleColumns: VariantTableColumn[], variants = [variant]) => {
  return (
    <VariantTable
      columns={visibleColumns}
      variants={variants}
      sortKey="info.proband"
      sortOrder="ascending"
      onClickVariant={jest.fn()}
      onHoverVariant={jest.fn()}
      onRequestSort={jest.fn()}
      onVisibleRowsChange={jest.fn()}
    />
  )
}

const rectangle = (left: number, width: number): DOMRect => ({
  x: left,
  y: 0,
  left,
  right: left + width,
  top: 0,
  bottom: 30,
  width,
  height: 30,
  toJSON: () => ({}),
})

const originalResizeObserver = window.ResizeObserver
let columnWidths: number[]
let horizontalScroll: number
let resizeCallbacks: Array<() => void>
const disconnect = jest.fn()

beforeEach(() => {
  columnWidths = [100, 120, 160, 110, 130]
  horizontalScroll = 0
  resizeCallbacks = []
  disconnect.mockClear()
  window.ResizeObserver = class implements ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      resizeCallbacks.push(() => callback([], this))
    }
    observe() {}
    unobserve() {}
    disconnect() {
      disconnect()
    }
  }
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute('role') !== 'columnheader') return rectangle(50, 800)
      const index = Number(this.getAttribute('aria-colindex')) - 1
      const left =
        50 + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0) - horizontalScroll
      return rectangle(left, columnWidths[index])
    })
})

afterEach(() => {
  window.ResizeObserver = originalResizeObserver
  jest.restoreAllMocks()
})

describe('measured variant column group headings', () => {
  it('centers one banner across the actual widths of each pair, after ungrouped columns', async () => {
    render(table(columns))

    expect(await screen.findByText('De novo AC')).toHaveStyle(
      'left: 100px; width: 280px; justify-content: center;'
    )
    expect(screen.getByText('Case-Control AC')).toHaveStyle('left: 380px; width: 240px;')
    expect(screen.getAllByText('De novo AC')).toHaveLength(1)
    expect(screen.getByRole('columnheader', { name: 'Proband' })).not.toHaveTextContent(
      'De novo AC'
    )
    expect(screen.getByRole('button', { name: 'Proband' })).toHaveStyle('width: 100%;')
    expect(screen.getByRole('group', { name: 'Variant column groups' })).toHaveStyle(
      'overflow: hidden;'
    )
  })

  it('remeasures when the grid columns resize without a window resize', () => {
    render(table(columns))
    columnWidths = [200, 190, 210, 180, 220]
    act(() => resizeCallbacks.forEach((callback) => callback()))

    expect(screen.getByText('De novo AC')).toHaveStyle('left: 200px; width: 400px;')
    expect(screen.getByText('Case-Control AC')).toHaveStyle('left: 600px; width: 400px;')
  })

  it('tracks horizontal scrolling and retains the full group width', () => {
    render(table(columns))
    const header = screen.getByRole('columnheader', { name: 'Proband' })
    const scrollViewport = header.parentElement?.parentElement
    if (!scrollViewport) throw new Error('Missing toolkit horizontal scroll viewport')
    horizontalScroll = 240
    fireEvent.scroll(scrollViewport)

    expect(screen.getByText('De novo AC')).toHaveStyle('left: -140px; width: 280px;')
    expect(screen.getByText('Case-Control AC')).toHaveStyle('left: 140px; width: 240px;')
  })

  it('removes deselected groups, repositions remaining groups, and restores them', async () => {
    const { rerender } = render(table(columns))
    const withoutDeNovo = columns.filter((column) => column.group?.key !== 'deNovo')
    columnWidths = [100, 110, 130]
    rerender(table(withoutDeNovo))

    expect(screen.queryByText('De novo AC')).not.toBeInTheDocument()
    expect(screen.getByText('Case-Control AC')).toHaveStyle('left: 100px; width: 240px;')

    rerender(table(columns.filter((column) => !column.group)))
    expect(screen.queryByRole('group', { name: 'Variant column groups' })).not.toBeInTheDocument()

    columnWidths = [100, 120, 160, 110, 130]
    rerender(table(columns))
    expect(await screen.findByText('De novo AC')).toHaveStyle('left: 100px; width: 280px;')
    expect(screen.getByText('Case-Control AC')).toHaveStyle('left: 380px; width: 240px;')
  })

  it.each([
    [false, false, false],
    [false, false, true],
    [false, true, false],
    [false, true, true],
    [true, false, false],
    [true, false, true],
    [true, true, false],
    [true, true, true],
  ])(
    'aligns visible groups for de novo=%s, case-control=%s, inherited=%s',
    async (deNovo, caseControl, inherited) => {
      const inheritedGroup = {
        key: 'inherited',
        geneTableLabel: 'Inherited',
        variantTableLabel: 'Inherited proband AC',
      }
      const allConfiguration: VariantColumnConfig[] = [
        ...configuration,
        { key: 'info.transmitted', heading: 'Transmitted', group: inheritedGroup },
        { key: 'info.untransmitted', heading: 'Untransmitted', group: inheritedGroup },
      ]
      const enabled: Record<string, boolean> = { deNovo, caseControl, inherited }
      const visibleColumns = getVariantTableColumns({
        datasetId: 'ASC2',
        variantResultColumns: allConfiguration,
        filter: {
          includeCategories: { lof: true, missense: true, synonymous: true, other: true },
          searchText: '',
          custom: undefined,
          asc2VariantColumnGroups: enabled,
        },
      }).filter((column) => allConfiguration.some((configured) => configured.key === column.key))
      columnWidths = visibleColumns.map(() => 100)
      render(table(visibleColumns))

      let left = 100
      for (const group of [deNovoGroup, caseControlGroup, inheritedGroup]) {
        if (enabled[group.key]) {
          expect(await screen.findByText(group.variantTableLabel)).toHaveStyle(
            `left: ${left}px; width: 200px;`
          )
          left += 200
        } else {
          expect(screen.queryByText(group.variantTableLabel)).not.toBeInTheDocument()
        }
      }
    }
  )

  it('disconnects observers when the table becomes empty', () => {
    const { rerender } = render(table(columns))
    rerender(table(columns, []))

    expect(screen.getByText('No variants found')).toBeInTheDocument()
    expect(screen.queryByText('De novo AC')).not.toBeInTheDocument()
    expect(disconnect).toHaveBeenCalled()
  })

  it('measures headers when the toolkit mounts them after the wrapper', async () => {
    const delayedTable = (showHeaders: boolean) => {
      const headers = columns.map((column, index) => (
        <div key={column.key} role="columnheader" aria-colindex={index + 1}>
          {column.heading}
        </div>
      ))
      const emptyGrid = null
      return (
        <VariantTableGroupHeadings columns={columns}>
          <div>{showHeaders ? headers : emptyGrid}</div>
        </VariantTableGroupHeadings>
      )
    }
    const { rerender } = render(delayedTable(false))
    expect(screen.queryByText('De novo AC')).not.toBeInTheDocument()

    rerender(delayedTable(true))
    expect(await screen.findByText('De novo AC')).toHaveStyle('left: 100px; width: 280px;')
  })

  it('remeasures on window resize when ResizeObserver is unavailable', () => {
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    render(table(columns))
    columnWidths = [150, 180, 190, 160, 170]
    fireEvent(window, new Event('resize'))

    expect(screen.getByText('De novo AC')).toHaveStyle('left: 150px; width: 370px;')
  })
})
