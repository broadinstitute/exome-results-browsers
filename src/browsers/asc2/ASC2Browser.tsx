import React, { ReactNode } from 'react'

import Browser, {
  GeneResultColumnConfig,
  GeneResultColumnGroup,
  VariantConsequence,
} from '../base/Browser'
import {
  renderCount,
  renderFloatAsScientific,
  renderStringOrFloatPvalueAsScientific,
} from '../base/tableCells'

import ASC2AboutPage from './ASC2AboutPage'
import ASC2HomePage from './ASC2HomePage'
import ASC2TermsPage from './ASC2TermsPage'
import {
  ASC2_VARIANT_CLASS_CATEGORIES,
  ASC2GeneResult,
  ASC2VariantClassCategory,
  ASC2VariantInfo,
} from './ascTypes'

// sizing of overridden bubbles on frequency lollipop chart
const ASC2_VARIANT_DOT_ALLELE_FREQ = 0.0003

export type ASC2VariantColumnGroup = 'deNovo' | 'transmittedUntransmitted' | 'caseControl'

const renderMissing = (value: any) => (value === null || value === undefined ? '\u2013' : value)

const renderBoolean = (value: boolean | null) =>
  value === null || value === undefined ? '\u2013' : value ? 'yes' : 'no'

import ASC2WaterfallPlot from './ASC2WaterfallPlot'

const geneCountColumn = (
  key: keyof ASC2GeneResult,
  heading: string,
  tooltip: string,
  minWidth = 70,
  group?: GeneResultColumnGroup
): GeneResultColumnConfig => ({
  key,
  heading,
  tooltip,
  minWidth,
  group,
  render: renderCount,
})

export const ascAnalysisGroups = ['meta'] as const
export type ASC2AnalysisGroup = typeof ascAnalysisGroups[number]
export const ascDefaultAnalysisGroup: ASC2AnalysisGroup = 'meta'

export const asc2VariantConsequences: VariantConsequence[] = [
  { term: 'frameshift', label: 'frameshift', category: 'lof' },
  { term: 'splice acceptor', label: 'splice acceptor', category: 'lof' },
  { term: 'splice donor', label: 'splice donor', category: 'lof' },
  { term: 'stop gained', label: 'stop gained', category: 'lof' },
  { term: 'start lost', label: 'start lost', category: 'missense' },
  { term: 'missense', label: 'missense', category: 'missense' },
  { term: 'synonymous', label: 'synonymous', category: 'synonymous' },
  { term: 'stop retained', label: 'stop retained', category: 'other' },
  { term: 'splice region', label: 'splice region', category: 'other' },
  { term: 'intron', label: 'intron', category: 'other' },
  { term: 'upstream gene', label: 'upstream gene', category: 'other' },
  { term: 'downstream gene', label: 'downstream gene', category: 'other' },
]

const COLUMN_GROUP_COLOR_A = '#e8e9ed'
const COLUMN_GROUP_COLOR_B = '#f0f1f3'
const COLUMN_GROUP_COLOR_C = '#dfe1e6'

const deNovoColumnGroup: GeneResultColumnGroup = {
  key: 'deNovo',
  label: 'De\u00a0novo',
  color: COLUMN_GROUP_COLOR_A,
}
const transmittedUntransmittedColumnGroup: GeneResultColumnGroup = {
  key: 'transmittedUntransmitted',
  label: 'Inherited (proband)',
  color: COLUMN_GROUP_COLOR_B,
}
const caseControlColumnGroup: GeneResultColumnGroup = {
  key: 'caseControl',
  label: 'Case-Control',
  color: COLUMN_GROUP_COLOR_C,
}

interface VariantClassColumnSpec {
  key: (category: ASC2VariantClassCategory) => keyof ASC2GeneResult
  heading: (category: ASC2VariantClassCategory) => string
  tooltip: (category: ASC2VariantClassCategory) => string
}

const variantClassCategoryColumns = (
  group: GeneResultColumnGroup,
  minWidth: number,
  columnsPerRole: VariantClassColumnSpec[]
): GeneResultColumnConfig[] =>
  ASC2_VARIANT_CLASS_CATEGORIES.flatMap((category) =>
    columnsPerRole.map(({ key, heading, tooltip }) =>
      geneCountColumn(key(category), heading(category), tooltip(category), minWidth, group)
    )
  )

const deNovoColumns = variantClassCategoryColumns(deNovoColumnGroup, 70, [
  {
    key: ({ suffix }) => `de_novo_${suffix}_proband`,
    heading: ({ label }) => `${label} Proband`,
    tooltip: ({ label, details }) => `De\u00a0novo ${label}${details} variants in probands`,
  },
  {
    key: ({ suffix }) => `de_novo_${suffix}_sibling`,
    heading: ({ label }) => `${label} Sibling`,
    tooltip: ({ label, details }) => `De\u00a0novo ${label}${details} variants in siblings`,
  },
])

const transmittedUntransmittedColumns = variantClassCategoryColumns(
  transmittedUntransmittedColumnGroup,
  110,
  [
    {
      key: ({ suffix }) => `transmitted_${suffix}_proband`,
      heading: ({ label }) => `Transmitted ${label}`,
      tooltip: ({ label, details }) => `${label}${details} variants transmitted to probands`,
    },
    {
      key: ({ suffix }) => `untransmitted_${suffix}_proband`,
      heading: ({ label }) => `Untransmitted ${label}`,
      tooltip: ({ label, details }) => `${label}${details} variants not transmitted to probands`,
    },
  ]
)

const caseControlColumns = variantClassCategoryColumns(caseControlColumnGroup, 70, [
  {
    key: ({ suffix }) => `${suffix}_case`,
    heading: ({ label }) => `${label} Case`,
    tooltip: ({ label, details }) =>
      `${label}${details} variants in case/control burden analysis, cases`,
  },
  {
    key: ({ suffix }) => `${suffix}_control`,
    heading: ({ label }) => `${label} Control`,
    tooltip: ({ label, details }) =>
      `${label}${details} variants in case/control burden analysis, controls`,
  },
])

const ASC2Browser = () => (
  <Browser
    browserTitle="DEMO; ASC exome analysis"
    navBarBackgroundColor="#23509c"
    homePage={ASC2HomePage}
    extraPages={[
      {
        path: '/about',
        label: 'About',
        component: ASC2AboutPage,
      },
      {
        path: '/terms',
        label: 'Terms',
        component: ASC2TermsPage,
      },
    ]}
    geneResultsPageHeading="Results"
    geneResultAnalysisGroupOptions={ascAnalysisGroups}
    defaultGeneResultAnalysisGroup={ascDefaultAnalysisGroup}
    defaultGeneResultSortKey="false_discovery_rate"
    geneResultColumns={[
      ...deNovoColumns,
      ...transmittedUntransmittedColumns,
      ...caseControlColumns,
      {
        key: 'bayes_factor',
        heading: 'Bayes Factor',
        minWidth: 140,
        render: (value) => renderStringOrFloatPvalueAsScientific({ value, decimalPlaces: 4 }),
      },
      {
        key: 'false_discovery_rate',
        heading: 'FDR',
        tooltip: 'False discovery rate',
        minWidth: 140,
        render: (value) => renderStringOrFloatPvalueAsScientific({ value, decimalPlaces: 4 }),
      },
      {
        key: 'was_flagged_in_qc',
        heading: 'Flag',
        tooltip: 'Gene flagged in analysis',
        minWidth: 90,
        render: (value) => `${value === true ? 'Yes' : ''}`,
      },
    ]}
    geneResultTabs={[
      {
        id: 'waterfall-plot',
        label: 'Waterfall Plot',
        render: () => <ASC2WaterfallPlot />,
      },
    ]}
    renderVariantAttributes={(info: ASC2VariantInfo) => [
      { label: 'MPC', content: info.mpc === null ? '–' : info.mpc },
      { label: 'AlphaMissense', content: info.alpha_missense === null ? '–' : info.alpha_missense },
      { label: 'gnomAD AF', content: info.gnomad_af === null ? '–' : info.gnomad_af },
    ]}
    variantAnalysisGroupOptions={ascAnalysisGroups}
    defaultVariantAnalysisGroup={ascDefaultAnalysisGroup}
    variantResultColumns={[
      {
        key: 'info.variant_class',
        heading: 'Class',
        tooltip: 'PTV/Mis2/Mis1/Mis0/synonymous, by MPC/AlphaMissense pathogenicity for missense variants',
        minWidth: 90,
        render: (value) => renderMissing(value),
      },
      {
        key: 'group_result.de_novo_ac_proband',
        heading: 'De\u00a0novo AC (proband)',
        tooltip: 'De\u00a0novo allele count in probands',
        minWidth: 110,
        group: 'deNovo',
      },
      {
        key: 'group_result.de_novo_ac_sibling',
        heading: 'De\u00a0novo AC (sibling)',
        tooltip: 'De\u00a0novo allele count in siblings',
        minWidth: 110,
        group: 'deNovo',
      },

      {
        key: 'group_result.transmitted_ac_proband',
        heading: 'Transmitted AC',
        tooltip: 'Allele count transmitted to probands',
        minWidth: 110,
        group: 'transmittedUntransmitted',
      },
      {
        key: 'group_result.untransmitted_ac_proband',
        heading: 'Untransmitted AC',
        tooltip: 'Allele count not transmitted to probands',
        minWidth: 110,
        group: 'transmittedUntransmitted',
      },

      {
        key: 'group_result.ac_case',
        heading: 'Case/control AC (case)',
        tooltip: 'Allele count in cases (case/control burden)',
        minWidth: 110,
        group: 'caseControl',
      },
      {
        key: 'group_result.ac_ctrl',
        heading: 'Case/control AC (control)',
        tooltip: 'Allele count in controls (case/control burden)',
        minWidth: 110,
        group: 'caseControl',
      },
      {
        key: 'info.gnomad_af',
        heading: 'gnomAD AF',
        minWidth: 110,
        render: (value) => renderFloatAsScientific({ value: value, decimalPlaces: 2 }),
        tooltip: 'Allele Frequency (AF) of this variant in the "non-neuro" subset of gnomAD v2.1.1',
      },
      {
        key: 'info.transcript_id',
        heading: 'Transcript ID',
        minWidth: 140,
        tooltip: 'Ensembl transcript ID',
        render: (value) => renderMissing(value),
      },

      {
        key: 'info.mpc',
        heading: 'MPC',
        tooltip: 'Missense deleteriousness Prediction by Constraint',
        minWidth: 110,
        render: (value) => renderFloatAsScientific({ value: value, decimalPlaces: 3 }),
      },
      {
        key: 'info.alpha_missense',
        heading: 'AM',
        tooltip: 'AlphaMissense pathogenicity score',
        minWidth: 110,
        render: (value) => renderFloatAsScientific({ value: value, decimalPlaces: 3 }),
      },
      {
        key: 'info.is_other_splice',
        heading: 'is OS',
        tooltip: 'LOFTEE other splice (OS) annotation',
        minWidth: 70,
        render: (value) => renderBoolean(value),
      },
    ]}
    variantConsequences={asc2VariantConsequences}
    variantAlleleFrequencyOverride={ASC2_VARIANT_DOT_ALLELE_FREQ}
    variantExportNote="Only SNVs, and not CNVs, are displayed below. All variants, except for Mis1 and synonymous variants were included in our gene discovery framework."
  />
)

export default ASC2Browser
