import React from 'react'

import Browser, { GeneResultColumnConfig, VariantConsequence } from '../base/Browser'
import { renderCount, renderStringOrFloatPvalueAsScientific } from '../base/tableCells'

import ASC2AboutPage from './ASC2AboutPage'
import ASC2HomePage from './ASC2HomePage'
import ASC2TermsPage from './ASC2TermsPage'
import {
  ASC2_VARIANT_CLASS_CATEGORIES,
  ASC2GeneResult,
  ASC2VariantGroupResult,
  ASC2VariantInfo,
} from './ascTypes'

const renderMissing = (value: unknown) => (value === null || value === undefined ? '\u2013' : value)

const renderBoolean = (value: boolean | null) =>
  value === null || value === undefined ? '\u2013' : value ? 'yes' : 'no'

import ASC2WaterfallPlot from './ASC2WaterfallPlot'

const geneCountColumn = (
  key: keyof ASC2GeneResult,
  heading: string,
  tooltip: string,
  minWidth = 70
): GeneResultColumnConfig => ({
  key,
  heading,
  tooltip,
  minWidth,
  render: renderCount,
})

const variantCountColumn = (
  field: keyof ASC2VariantGroupResult,
  heading: string,
  tooltip: string,
  minWidth = 90
) => ({
  key: `group_result.${field}`,
  heading,
  tooltip,
  minWidth,
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

const deNovoColumns: GeneResultColumnConfig[] = ASC2_VARIANT_CLASS_CATEGORIES.flatMap(
  ({ suffix, label }) => [
    geneCountColumn(
      `de_novo_${suffix}_proband`,
      `De\u00a0novo ${label} Proband`,
      `De\u00a0novo ${label} variants in probands`
    ),
    geneCountColumn(
      `de_novo_${suffix}_sibling`,
      `De\u00a0novo ${label} Sibling`,
      `De\u00a0novo ${label} variants in siblings`
    ),
  ]
)

const transmittedUntransmittedColumns: GeneResultColumnConfig[] = ASC2_VARIANT_CLASS_CATEGORIES.flatMap(
  ({ suffix, label }) => [
    geneCountColumn(
      `transmitted_${suffix}_proband`,
      `Transmitted ${label}`,
      `${label} variants transmitted to probands`,
      90
    ),
    geneCountColumn(
      `untransmitted_${suffix}_proband`,
      `Untransmitted ${label}`,
      `${label} variants not transmitted to probands`,
      100
    ),
  ]
)

const caseControlColumns: GeneResultColumnConfig[] = ASC2_VARIANT_CLASS_CATEGORIES.flatMap(
  ({ suffix, label }) => [
    geneCountColumn(
      `${suffix}_case`,
      `${label} Case`,
      `${label} variants in case/control burden analysis, cases`
    ),
    geneCountColumn(
      `${suffix}_control`,
      `${label} Control`,
      `${label} variants in case/control burden analysis, controls`
    ),
  ]
)

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
        key: 'fdr',
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
      variantInfoColumn('transcript_id', 'Transcript ID', 'Ensembl transcript ID', 120),
      variantInfoColumn('variant_class', 'Class', 'PTV/Mis2/Mis1/Mis0/synonymous, by MPC/AlphaMissense pathogenicity for missense variants', 90),
      variantInfoColumn('mpc', 'MPC', 'Missense deleteriousness Prediction by Constraint', 70),
      variantInfoColumn('alpha_missense', 'AM', 'AlphaMissense pathogenicity score', 70),
      variantInfoColumn('is_other_splice', 'isOS', 'LOFTEE other splice (OS) annotation (meaning not yet confirmed by analysts)', 70, renderBoolean),
      variantInfoColumn('gnomad_af', 'gnomAD AF', 'Allele frequency in gnomAD', 90),

      variantCountColumn('de_novo_ac_proband', 'De\u00a0novo AC (proband)', 'De\u00a0novo allele count in probands'),
      variantCountColumn('de_novo_ac_sibling', 'De\u00a0novo AC (sibling)', 'De\u00a0novo allele count in siblings'),

      variantCountColumn('transmitted_ac_proband', 'Transmitted AC', 'Allele count transmitted to probands'),
      variantCountColumn('untransmitted_ac_proband', 'Untransmitted AC', 'Allele count not transmitted to probands'),

      variantCountColumn('ac_case', 'Case/control AC (case)', 'Allele count in cases (case/control burden)'),
      variantCountColumn('ac_ctrl', 'Case/control AC (control)', 'Allele count in controls (case/control burden)'),
    ]}
    variantConsequences={asc2VariantConsequences}
  />
)

export default ASC2Browser
