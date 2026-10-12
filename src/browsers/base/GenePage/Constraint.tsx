import React from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { BaseTable, TooltipAnchor, TooltipHint } from '@gnomad/ui'

export const CONSTRAINT_HIGHLIGHT_THRESHOLDS = {
  synonymousZ: 3.71,
  missenseZ: 3.09,
  loeufRed: 0.33,
  loeufOrange: 0.66,
  loeufYellow: 1,
} as const

const CONSTRAINT_HIGHLIGHT_COLORS = {
  red: '#ff2600',
  orange: '#ff9300',
  yellow: '#ffc000',
} as const

const HighlightedNumber = styled.span<{ $highlightColor: string }>`
  padding: 0 0.25em;
  border-radius: 0.25em;
  background-color: ${(props) => props.$highlightColor};
  color: #000;
`

const getLoeufHighlightColor = (loeuf: number | null | undefined) => {
  if (loeuf === null || loeuf === undefined) return null
  if (loeuf < CONSTRAINT_HIGHLIGHT_THRESHOLDS.loeufRed) return CONSTRAINT_HIGHLIGHT_COLORS.red
  if (loeuf < CONSTRAINT_HIGHLIGHT_THRESHOLDS.loeufOrange) return CONSTRAINT_HIGHLIGHT_COLORS.orange
  if (loeuf < CONSTRAINT_HIGHLIGHT_THRESHOLDS.loeufYellow) return CONSTRAINT_HIGHLIGHT_COLORS.yellow
  return null
}

const renderNumber = (num: number | null, precision: number = 1) => {
  return num === null ? '—' : Number(num.toFixed(precision)).toString()
}

const renderConstraintNumber = (value: number | null, color: string | null, label: string) => {
  const formattedNumber = renderNumber(value, 2)
  if (color === null || value === null) return formattedNumber
  return (
    <HighlightedNumber $highlightColor={color} title={`${label}: ${value}`}>
      {formattedNumber}
    </HighlightedNumber>
  )
}

const Table = styled(BaseTable)`
  td {
    white-space: nowrap;
  }
`

export interface Constraint {
  exp_lof: number | null
  exp_mis: number | null
  exp_syn: number | null
  obs_lof: number | null
  obs_mis: number | null
  obs_syn: number | null
  oe_lof: number | null
  oe_lof_lower?: number | null
  oe_lof_upper?: number | null
  oe_mis: number | null
  oe_syn: number | null
  lof_z: number | null
  mis_z: number | null
  syn_z: number | null
  pLI: number | null
}

interface ExacConstraintTableProps {
  constraint: Constraint
}

export const ExacConstraintTable = ({ constraint }: ExacConstraintTableProps) => (
  <Table>
    <thead>
      <tr>
        <th scope="col">Category</th>
        <th scope="col">Exp. SNVs</th>
        <th scope="col">Obs. SNVs</th>
        <th scope="col">Constraint metrics</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Synonymous</th>
        <td>{renderNumber(constraint.exp_syn)}</td>
        <td>{constraint.obs_syn === null ? '—' : constraint.obs_syn}</td>
        <td>Z = {renderNumber(constraint.syn_z, 2)}</td>
      </tr>
      <tr>
        <th scope="row">Missense</th>
        <td>{renderNumber(constraint.exp_mis)}</td>
        <td>{constraint.obs_mis === null ? '—' : constraint.obs_mis}</td>
        <td>Z = {renderNumber(constraint.mis_z, 2)}</td>
      </tr>
      <tr>
        <th scope="row">pLoF</th>
        <td>{renderNumber(constraint.exp_lof)}</td>
        <td>{constraint.obs_lof === null ? '—' : constraint.obs_lof}</td>
        <td>pLI = {renderNumber(constraint.pLI, 2)}</td>
      </tr>
    </tbody>
  </Table>
)

interface GnomadConstraintTableProps {
  constraint: Constraint
}

export const GnomadConstraintTable = ({
  constraint,
}: GnomadConstraintTableProps): React.ReactElement => {
  const synonymousHighlightColor =
    constraint.syn_z !== null && constraint.syn_z > CONSTRAINT_HIGHLIGHT_THRESHOLDS.synonymousZ
      ? CONSTRAINT_HIGHLIGHT_COLORS.red
      : null
  const missenseHighlightColor =
    constraint.mis_z !== null && constraint.mis_z > CONSTRAINT_HIGHLIGHT_THRESHOLDS.missenseZ
      ? CONSTRAINT_HIGHLIGHT_COLORS.orange
      : null
  const lofHighlightColor = getLoeufHighlightColor(constraint.oe_lof_upper)

  return (
    <Table>
      <thead>
        <tr>
          <th scope="col">
            <TooltipAnchor tooltip="VEP consequence category.">
              <TooltipHint>Category</TooltipHint>
            </TooltipAnchor>
          </th>
          <th scope="col">
            <TooltipAnchor tooltip="Expected variant counts were predicted using a depth corrected probability of mutation for each gene.">
              <TooltipHint>Exp. SNVs</TooltipHint>
            </TooltipAnchor>
          </th>
          <th scope="col">
            <TooltipAnchor tooltip="Includes single nucleotide changes that occurred in the canonical transcript that were found at a frequency of <0.1%, passed all filters, and at sites with a median depth ≥1.">
              <TooltipHint>Obs. SNVs</TooltipHint>
            </TooltipAnchor>
          </th>
          <th colSpan={2} scope="col">
            <TooltipAnchor tooltip="A signed Z score, positive scores indicate increased constraint (intolerance to variation), and the is the observed to expected ratio (o/e) of number of variants in this gene for the consequence category.">
              <TooltipHint>Constraint metrics</TooltipHint>
            </TooltipAnchor>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Synonymous</th>
          <td>{renderNumber(constraint.exp_syn)}</td>
          <td>{constraint.obs_syn === null ? '—' : constraint.obs_syn}</td>
          <td>
            Z ={' '}
            {renderConstraintNumber(
              constraint.syn_z,
              synonymousHighlightColor,
              `Synonymous Z > ${CONSTRAINT_HIGHLIGHT_THRESHOLDS.synonymousZ}`
            )}
          </td>
          <td>o/e = {renderNumber(constraint.oe_syn, 2)}</td>
        </tr>
        <tr>
          <th scope="row">Missense</th>
          <td>{renderNumber(constraint.exp_mis)}</td>
          <td>{constraint.obs_mis === null ? '—' : constraint.obs_mis}</td>
          <td>
            Z ={' '}
            {renderConstraintNumber(
              constraint.mis_z,
              missenseHighlightColor,
              `Missense Z > ${CONSTRAINT_HIGHLIGHT_THRESHOLDS.missenseZ}`
            )}
          </td>
          <td>o/e = {renderNumber(constraint.oe_mis, 2)}</td>
        </tr>
        <tr>
          <th scope="row">pLoF</th>
          <td>{renderNumber(constraint.exp_lof)}</td>
          <td>{constraint.obs_lof === null ? '—' : constraint.obs_lof}</td>
          <td>pLI = {renderNumber(constraint.pLI, 2)}</td>
          <td>
            o/e = {renderNumber(constraint.oe_lof, 2)}
            {constraint.oe_lof_lower !== null &&
              constraint.oe_lof_lower !== undefined &&
              constraint.oe_lof_upper !== null &&
              constraint.oe_lof_upper !== undefined && (
                <>
                  {' '}
                  ({renderNumber(constraint.oe_lof_lower, 2)} -{' '}
                  {renderConstraintNumber(
                    constraint.oe_lof_upper,
                    lofHighlightColor,
                    'LOEUF, pLoF o/e upper confidence bound'
                  )}
                  )
                </>
              )}
          </td>
        </tr>
      </tbody>
    </Table>
  )
}
