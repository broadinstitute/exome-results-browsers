import React from 'react'
import styled from 'styled-components'

import { ASC2VariantClass } from './ascTypes'

export const ASC2_VARIANT_CLASS_COLORS: Record<ASC2VariantClass, string> = {
  PTV: '#cc0f74',
  Mis2: '#f07800',
  Mis1: '#ffa600',
  Mis0: '#ffda70',
  synonymous: '#e4f4e1',
}

const DEFAULT_VARIANT_CLASS_COLOR = '#e0e0e0'

const ASC2_VARIANT_CLASS_SEVERITY_RANK: Record<ASC2VariantClass, number> = {
  PTV: 0,
  Mis2: 1,
  Mis1: 2,
  Mis0: 3,
  synonymous: 4,
}

const UNRECOGNIZED_VARIANT_CLASS_RANK = 99

const lookupByVariantClass = <T,>(
  table: Partial<Record<ASC2VariantClass, T>>,
  variantClass: string,
  fallback: T
): T => (table as Record<string, T>)[variantClass] ?? fallback

export const compareASC2VariantClassSeverity = (a: string, b: string): number =>
  lookupByVariantClass(ASC2_VARIANT_CLASS_SEVERITY_RANK, a, UNRECOGNIZED_VARIANT_CLASS_RANK) -
  lookupByVariantClass(ASC2_VARIANT_CLASS_SEVERITY_RANK, b, UNRECOGNIZED_VARIANT_CLASS_RANK)

const VARIANT_CLASS_LABELS: Partial<Record<ASC2VariantClass, string>> = {
  synonymous: 'Synonymous',
}

const isLightColor = (hexColor: string): boolean => {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}

const Badge = styled.span<{ $color: string; $isLight: boolean }>`
  display: inline-block;
  padding: 0.25em 0.5em 0.2em;
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 0.3em;
  background: ${({ $color }) => $color};
  color: ${({ $isLight }) => ($isLight ? '#000' : '#fff')};
  font-size: 0.75em;
  font-weight: bold;
  line-height: 1;
  white-space: nowrap;
`

const ASC2VariantClassBadge = ({ variantClass }: { variantClass: string }) => {
  const color = lookupByVariantClass(
    ASC2_VARIANT_CLASS_COLORS,
    variantClass,
    DEFAULT_VARIANT_CLASS_COLOR
  )

  return (
    <Badge $color={color} $isLight={isLightColor(color)}>
      {lookupByVariantClass(VARIANT_CLASS_LABELS, variantClass, variantClass)}
    </Badge>
  )
}

export default ASC2VariantClassBadge
