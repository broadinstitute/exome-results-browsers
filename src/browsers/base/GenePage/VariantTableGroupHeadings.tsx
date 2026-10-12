import React, { useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { GeneResultColumnGroup } from '../Browser'
import { DEFAULT_COLUMN_GROUP_COLOR } from '../columnGroupHeadings'
import { VariantTableColumn } from './variantTableColumns'

const GroupedTableContainer = styled.div`
  [role='columnheader'] > button,
  [role='columnheader'] > span {
    width: 100%;
    text-align: left;
  }
`

const GroupHeadingViewport = styled.div`
  position: relative;
  overflow: hidden;
  height: 2.5em;
`

const GroupHeadingBanner = styled.div<{ $color: string }>`
  position: absolute;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 100%;
  padding: 0.4em 0.5em;
  background: ${({ $color }) => $color};
  font-weight: bold;
  white-space: nowrap;
`

interface MeasuredColumnGroup {
  key: string
  group: GeneResultColumnGroup
  left: number
  width: number
}

interface VariantTableGroupHeadingsProps {
  columns: VariantTableColumn[]
  children: React.ReactNode
}

const VariantTableGroupHeadings = ({
  columns,
  children,
}: VariantTableGroupHeadingsProps): React.ReactElement => {
  const tableContainer = useRef<HTMLDivElement>(null)
  const [measuredGroups, setMeasuredGroups] = useState<MeasuredColumnGroup[]>([])
  const previousMeasurements = useRef<MeasuredColumnGroup[]>([])
  const hasGroups = columns.some((column) => column.group)

  useLayoutEffect(() => {
    const container = tableContainer.current
    if (!container || !hasGroups) return undefined

    const observedHeaders = new Set<Element>()
    const measureGroups = () => {
      // Match the toolkit's column indices rather than its generated styled-component classes.
      const headers = columns.map((_, index) =>
        container.querySelector<HTMLElement>(`[role="columnheader"][aria-colindex="${index + 1}"]`)
      )
      const containerLeft = container.getBoundingClientRect().left
      const nextGroups: MeasuredColumnGroup[] = []
      columns.forEach((column, index) => {
        const header = headers[index]
        if (!header) return
        if (resizeObserver && !observedHeaders.has(header)) {
          resizeObserver.observe(header)
          observedHeaders.add(header)
        }
        if (!column.group) return
        const bounds = header.getBoundingClientRect()
        const previousGroup = nextGroups[nextGroups.length - 1]
        if (index > 0 && columns[index - 1].group?.key === column.group.key && previousGroup) {
          previousGroup.width = bounds.right - containerLeft - previousGroup.left
        } else {
          nextGroups.push({
            key: column.key,
            group: column.group,
            left: bounds.left - containerLeft,
            width: bounds.width,
          })
        }
      })
      observedHeaders.forEach((header) => {
        if (!container.contains(header)) {
          resizeObserver?.unobserve(header)
          observedHeaders.delete(header)
        }
      })
      const previousGroups = previousMeasurements.current
      const isUnchanged =
        previousGroups.length === nextGroups.length &&
        previousGroups.every((group, index) => {
          const next = nextGroups[index]
          return (
            group.key === next.key &&
            group.group === next.group &&
            group.left === next.left &&
            group.width === next.width
          )
        })
      if (!isUnchanged) {
        previousMeasurements.current = nextGroups
        setMeasuredGroups(nextGroups)
      }
    }
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureGroups)
    const mutationObserver = new MutationObserver(measureGroups)
    resizeObserver?.observe(container)
    const grid = container.querySelector('[role="grid"]') ?? container
    mutationObserver.observe(grid, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'width', 'aria-colindex'],
    })
    container.addEventListener('scroll', measureGroups, true)
    window.addEventListener('resize', measureGroups)
    measureGroups()

    return () => {
      resizeObserver?.disconnect()
      mutationObserver.disconnect()
      container.removeEventListener('scroll', measureGroups, true)
      window.removeEventListener('resize', measureGroups)
    }
  }, [columns, hasGroups])

  const groupedTable = (
    <GroupedTableContainer ref={tableContainer}>
      <GroupHeadingViewport role="group" aria-label="Variant column groups">
        {measuredGroups.map(({ key, group, left, width }) => (
          <GroupHeadingBanner
            key={key}
            $color={group.color ?? DEFAULT_COLUMN_GROUP_COLOR}
            style={{ left, width }}
            title={group.variantTableLabel}
          >
            {group.variantTableLabel}
          </GroupHeadingBanner>
        ))}
      </GroupHeadingViewport>
      {children}
    </GroupedTableContainer>
  )
  const ungroupedTable = <>{children}</>
  return hasGroups ? groupedTable : ungroupedTable
}

export default VariantTableGroupHeadings
