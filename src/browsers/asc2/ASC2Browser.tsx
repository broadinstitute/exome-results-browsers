import React from 'react'

import Browser, {
  GeneResultColumnConfig,
  GeneResultColumnGroup,
  VariantConsequence,
} from '../base/Browser'
import { renderCount, renderStringOrFloatPvalueAsScientific } from '../base/tableCells'

import ASC2AboutPage from './ASC2AboutPage'
import ASC2HomePage from './ASC2HomePage'
import ASC2TermsPage from './ASC2TermsPage'
import {
  ASC2_VARIANT_CLASS_CATEGORIES,
  ASC2GeneResult,
  ASC2VariantClassCategory,
  ASC2VariantGroupResult,
  ASC2VariantInfo,
} from './ascTypes'

// sizing of overridden bubbles on frequency lollipop chart
const ASC2_VARIANT_DOT_ALLELE_FREQ = 0.0003

export type ASC2VariantColumnGroup = 'deNovo' | 'transmittedUntransmitted' | 'caseControl'

const renderMissing = (value: unknown) => (value === null || value === undefined ? '\u2013' : value)

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

const variantCountColumn = (
  field: keyof ASC2VariantGroupResult,
  heading: string,
  tooltip: string,
  minWidth = 110,
  group?: ASC2VariantColumnGroup
) => ({
  key: `group_result.${field}`,
  heading,
  tooltip,
  minWidth,
  group,
})

const variantInfoColumn = (
  field: keyof ASC2VariantInfo,
  heading: string,
  tooltip: string,
  minWidth = 80,
  render: (value: any) => React.ReactNode = renderMissing
) => ({
  key: `info.${field}`,
  heading,
  tooltip,
  minWidth,
  render,
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
    browserTitle="ASC exome analysis"
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
    defaultGeneResultSortKey="fdr"
    geneResultColumns={[
      ...deNovoColumns,
      ...transmittedUntransmittedColumns,
      ...caseControlColumns,
      {
        key: 'bayes_factor',
        heading: 'Bayes Factor',
        minWidth: 100,
        render: (value) => renderStringOrFloatPvalueAsScientific({ value }),
      },
      {
        key: 'false_discovery_rate',
        heading: 'FDR',
        minWidth: 100,
        render: (value) => renderStringOrFloatPvalueAsScientific({ value, decimalPlaces: 4 }),
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
      { label: 'AlphaMissense', content: info.alphamissense === null ? '–' : info.alphamissense },
      { label: 'gnomAD AF', content: info.gnomad_af === null ? '–' : info.gnomad_af },
    ]}
    variantAnalysisGroupOptions={ascAnalysisGroups}
    defaultVariantAnalysisGroup={ascDefaultAnalysisGroup}
    variantResultColumns={[
      // TK: see if analyst wants this column, keep it commented here for now
      // variantInfoColumn('variant_class', 'Class', 'PTV/Mis2/Mis1/Mis0/synonymous, by MPC/AlphaMissense pathogenicity for missense variants', 90),

      variantCountColumn(
        'de_novo_ac_proband',
        'De\u00a0novo AC (proband)',
        'De\u00a0novo allele count in probands',
        110,
        'deNovo'
      ),
      variantCountColumn(
        'de_novo_ac_sibling',
        'De\u00a0novo AC (sibling)',
        'De\u00a0novo allele count in siblings',
        110,
        'deNovo'
      ),

      variantCountColumn(
        'transmitted_ac_proband',
        'Transmitted AC',
        'Allele count transmitted to probands',
        110,
        'transmittedUntransmitted'
      ),
      variantCountColumn(
        'untransmitted_ac_proband',
        'Untransmitted AC',
        'Allele count not transmitted to probands',
        110,
        'transmittedUntransmitted'
      ),

      variantCountColumn(
        'ac_case',
        'Case/control AC (case)',
        'Allele count in cases (case/control burden)',
        110,
        'caseControl'
      ),
      variantCountColumn(
        'ac_ctrl',
        'Case/control AC (control)',
        'Allele count in controls (case/control burden)',
        110,
        'caseControl'
      ),

      variantInfoColumn('gnomad_af', 'gnomAD AF', 'Allele frequency in gnomAD', 90),
      variantInfoColumn('transcript_id', 'Transcript ID', 'Ensembl transcript ID', 140),

      variantInfoColumn('mpc', 'MPC', 'Missense deleteriousness Prediction by Constraint', 70),
      variantInfoColumn(
        'alpha_missense',
        'AlphaMissense',
        'AlphaMissense pathogenicity score',
        110
      ),
      variantInfoColumn(
        'is_other_splice',
        'is other splice',
        'LOFTEE other splice (OS) annotation (meaning not yet confirmed by analysts)',
        70,
        renderBoolean
      ),
    ]}
    variantConsequences={asc2VariantConsequences}
    variantAlleleFrequencyOverride={ASC2_VARIANT_DOT_ALLELE_FREQ}
  />
)

export default ASC2Browser
