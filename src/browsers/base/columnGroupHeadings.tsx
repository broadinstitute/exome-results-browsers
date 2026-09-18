import React from 'react'
import styled from 'styled-components'

import { GeneResultColumnGroup } from './Browser'

export const DEFAULT_COLUMN_GROUP_COLOR = '#eef1f7'

const ColumnGroupBanner = styled.div<{ $color: string; $hasLabel: boolean }>`
  position: relative;
  z-index: ${({ $hasLabel }) => ($hasLabel ? 1 : 0)};
  margin: -0.25em -20px 0.35em -0.5em;
  padding: 0.4em 20px 0.25em 0.5em;
  height: 1.5em;
  background: ${({ $color }) => $color};
`

const ColumnGroupBannerLabel = styled.span`
  position: absolute;
  left: 0.5em;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  font-weight: bold;
`

export interface ColumnWithOptionalGroup {
  key: string
  heading?: React.ReactNode
  group?: GeneResultColumnGroup
}

// styling hack; render a solid colored banner for adjacent columns of the same group
// TK: add support for this in gnomad browser toolkit properly
export const applyColumnGroupHeadings = <Column extends ColumnWithOptionalGroup>(
  columns: Column[]
): Column[] =>
  columns.map((column, index) => {
    if (!column.group) {
      return column
    }

    const previousColumn = columns[index - 1]
    const isFirstInGroupRun = previousColumn?.group?.key !== column.group.key
    const color = column.group.color || DEFAULT_COLUMN_GROUP_COLOR

    return {
      ...column,
      heading: (
        <React.Fragment>
          <ColumnGroupBanner $color={color} $hasLabel={isFirstInGroupRun}>
            {isFirstInGroupRun ? (
              <ColumnGroupBannerLabel>{column.group.label}</ColumnGroupBannerLabel>
            ) : null}
          </ColumnGroupBanner>
          <div>{column.heading || column.key}</div>
        </React.Fragment>
      ),
    }
  })

export const getColumnGroups = <Column extends ColumnWithOptionalGroup>(
  columns: Column[]
): GeneResultColumnGroup[] => {
  const groups: GeneResultColumnGroup[] = []
  columns.forEach((column) => {
    if (column.group && !groups.some((group) => group.key === column.group!.key)) {
      groups.push(column.group)
    }
  })
  return groups
}
