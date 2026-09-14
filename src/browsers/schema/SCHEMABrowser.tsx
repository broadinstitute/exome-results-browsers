import React from 'react'

import ExomeResultsBrowser, {
  GeneResultColumnConfig,
  RenderVariantAttributes,
  VariantColumnConfig,
  VariantCustomFilter,
} from '../base/Browser'
import GeneResultsManhattanPlot from '../base/GeneResultsPage/GeneResultsManhattanPlot'
import GeneResultsQQPlot from '../base/GeneResultsPage/GeneResultsQQPlot'
import {
  renderCount,
  renderOddsRatio,
  renderStringOrFloatPvalueAsScientific,
} from '../base/tableCells'
import vepConsequences from '../base/vepConsequences'

import SCHEMAAboutPage from './SCHEMAAboutPage'
import SCHEMAHomePage from './SCHEMAHomePage'
import SCHEMATermsPage from './SCHEMATermsPage'
import SCHEMAVariantFilter from './SCHEMAVariantFilter'
import { SchemaGeneRow } from './schemaGeneTypes'
import { SchemaVariantInfo, SchemaVariantRow } from './schemaVariantTypes'

const variantConsequences = [...vepConsequences]
variantConsequences.splice(
  vepConsequences.findIndex(({ term }) => term === 'missense_variant'),
  1,
  {
    term: 'missense_variant',
    label: 'missense',
    category: 'missense',
  },
  {
    term: 'missense_variant_mpc_>=3',
    label: 'missense (MPC\u00a0≥\u00a03)',
    category: 'missense',
  },
  {
    term: 'missense_variant_mpc_2-3',
    label: 'missense (2\u00a0≤\u00a0MPC\u00a0<\u00a03)',
    category: 'missense',
  },
  {
    term: 'missense_variant_mpc_<2',
    label: 'missense (MPC\u00a0<\u00a02)',
    category: 'missense',
  },
  {
    term: 'transcript_ablation_LC',
    label: 'LC transcript ablation',
    category: 'lof',
  },
  {
    term: 'splice_acceptor_variant_LC',
    label: 'LC splice acceptor',
    category: 'lof',
  },
  {
    term: 'splice_donor_variant_LC',
    label: 'LC splice donor',
    category: 'lof',
  },
  {
    term: 'stop_gained_LC',
    label: 'LC stop gained',
    category: 'lof',
  },
  {
    term: 'frameshift_variant_LC',
    label: 'LC frameshift',
    category: 'lof',
  }
)

export const schemaAnalysisGroups = ['meta'] as const
export type SCHEMAAnalysisGroup = typeof schemaAnalysisGroups[number]
export const schemaDefaultAnalysisGroup: SCHEMAAnalysisGroup = 'meta'

const schemaCaseControlPValueColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'schema_case_control_p_value',
  heading: 'Case-Control SCHEMA P-value',
  tooltip:
    'SCHEMA p-value of the CMH p-value from PTV burden and the CMH p-value from PTV + missense burden.',
  minWidth: 100,
  accessor: (row) => row.schema_case_control_p_value,
  render: (value) => renderStringOrFloatPvalueAsScientific({ value: value }),
}

const ptvCaseCarrierColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'ptv_case_carrier',
  heading: 'Case PTV',
  tooltip:
    'Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites. Aggregated counts from variants with minor allele count [MAC] <= 15',
  minWidth: 70,
  accessor: (row) => row.ptv_case_carrier,
  render: (value) => renderCount(value),
}

const ptvControlCarrierColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'ptv_control_carrier',
  heading: 'Control PTV',
  tooltip:
    'Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites. Aggregated counts from variants with minor allele count [MAC] <= 15',
  minWidth: 70,
  accessor: (row) => row.ptv_control_carrier,
  render: (value) => renderCount(value),
}

const ptvMisCaseCarrierColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'ptv_mis_case_carrier',
  heading: 'Case PTV + Missense',
  tooltip:
    'Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites, and missense variants predicted to be damaging (mean missense rank percentile >= 93%). Aggregated counts from variants with minor allele count [MAC] <= 15',
  minWidth: 100,
  accessor: (row) => row.ptv_mis_case_carrier,
  render: (value) => renderCount(value),
}

const ptvMisControlCarrierColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'ptv_mis_control_carrier',
  heading: 'Control PTV + Missense',
  tooltip:
    'Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites, and missense variants predicted to be damaging (mean missense rank percentile >= 93%). Aggregated counts from variants with minor allele count [MAC] <= 15',
  minWidth: 100,
  accessor: (row) => row.ptv_mis_control_carrier,
  render: (value) => renderCount(value),
}

const ptvNDeNovoColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'ptv_n_de_novo',
  heading: 'De Novo PTV',
  tooltip: 'Determined to be de novo of origin in 3,402 parent-proband trios.',
  minWidth: 90,
  accessor: (row) => row.ptv_n_de_novo,
  render: (value) => renderCount(value),
}

const ptvMisNDeNovoColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'ptv_mis_n_de_novo',
  heading: 'De Novo PTV + Missense',
  tooltip: 'Determined to be de novo of origin in 3,402 parent-proband trios.',
  minWidth: 100,
  accessor: (row) => row.ptv_mis_n_de_novo,
  render: (value) => renderCount(value),
}

const caseControlPlusDeNovoPValueColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'case_control_plus_de_novo_p_value',
  heading: 'Case-Control + de novo P-value',
  tooltip:
    'Weighted meta-analysis p-value combining the Case-Control SCHEMA p-value with the De Novo pvalue',
  minWidth: 100,
  accessor: (row) => row.case_control_plus_de_novo_p_value,
  render: (value) => renderStringOrFloatPvalueAsScientific({ value: value }),
}

const ptvOddsRatioColumn: GeneResultColumnConfig<SchemaGeneRow, string> = {
  key: 'ptv_odds_ratio',
  heading: 'OR PTV',
  tooltip: 'Odds Ratio: The relative increase in schizophrenia risk associated with PTVs.',
  minWidth: 110,
  accessor: (row) => row.ptv_odds_ratio,
  render: (value) => renderOddsRatio({ value: value }),
}

const ptvMisOddsRatioColumn: GeneResultColumnConfig<SchemaGeneRow, string> = {
  key: 'ptv_mis_odds_ratio',
  heading: 'OR PTV + Missense',
  tooltip:
    'Odds Ratio: The relative increase in schizophrenia risk associated with PTVs + missense variants predicted to be damaging.',
  minWidth: 110,
  accessor: (row) => row.ptv_mis_odds_ratio,
  render: (value) => renderOddsRatio({ value: value }),
}

const misCaseCarrierColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'mis_case_carrier',
  heading: 'Case Missense',
  tooltip: 'Missense variants, aggregated counts from variants with minor allele count [MAC] <= 15',
  minWidth: 100,
  accessor: (row) => row.mis_case_carrier,
  render: (value) => renderCount(value),
}

const misControlCarrierColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'mis_control_carrier',
  heading: 'Control Missense',
  tooltip: 'Missense variants, aggregated counts from variants with minor allele count [MAC] <= 15',
  minWidth: 100,
  accessor: (row) => row.mis_control_carrier,
  render: (value) => renderCount(value),
}

const synCaseCarrierColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'syn_case_carrier',
  heading: 'Case Synonymous',
  tooltip:
    'Synonymous variants, aggregated counts from variants with minor allele count [MAC] <= 15',
  minWidth: 100,
  accessor: (row) => row.syn_case_carrier,
  render: (value) => renderCount(value),
}

const synControlCarrierColumn: GeneResultColumnConfig<SchemaGeneRow, number> = {
  key: 'syn_control_carrier',
  heading: 'Control Synonymous',
  tooltip:
    'Synonymous variants, aggregated counts from variants with minor allele count [MAC] <= 15',
  minWidth: 100,
  accessor: (row) => row.syn_control_carrier,
  render: (value) => renderCount(value),
}

const misOddsRatioColumn: GeneResultColumnConfig<SchemaGeneRow, string> = {
  key: 'mis_odds_ratio',
  heading: 'OR Missense',
  tooltip: 'Odds Ratio: The relative increase in schizophrenia risk associated with PTVs.',
  minWidth: 110,
  accessor: (row) => row.mis_odds_ratio,
  render: (value) => renderOddsRatio({ value: value }),
}

const synOddsRatioColumn: GeneResultColumnConfig<SchemaGeneRow, string> = {
  key: 'syn_odds_ratio',
  heading: 'OR Synonymous',
  tooltip: 'Odds Ratio: The relative increase in schizophrenia risk associated with PTVs.',
  minWidth: 110,
  accessor: (row) => row.syn_odds_ratio,
  render: (value) => renderOddsRatio({ value: value }),
}

export const schemaGeneResultColumns: GeneResultColumnConfig<SchemaGeneRow, any>[] = [
  schemaCaseControlPValueColumn,
  ptvCaseCarrierColumn,
  ptvControlCarrierColumn,
  ptvMisCaseCarrierColumn,
  ptvMisControlCarrierColumn,
  ptvNDeNovoColumn,
  ptvMisNDeNovoColumn,
  caseControlPlusDeNovoPValueColumn,
  ptvOddsRatioColumn,
  ptvMisOddsRatioColumn,
  misCaseCarrierColumn,
  misControlCarrierColumn,
  synCaseCarrierColumn,
  synControlCarrierColumn,
  misOddsRatioColumn,
  synOddsRatioColumn,
]

const schemaVariantNDeNovoColumn: VariantColumnConfig<SchemaVariantRow, number> = {
  key: 'group_result.n_de_novo',
  heading: 'No. de novos',
  minWidth: 80,
  type: 'int',
  tooltip: 'Out of AC case, the number of genotypes determined to de novo in origin.',
  accessor: (row) => row.group_result.n_de_novo,
}

const schemaVariantInAnalysisColumn: VariantColumnConfig<SchemaVariantRow, boolean> = {
  key: 'group_result.in_analysis',
  heading: 'In Analysis',
  minWidth: 85,
  tooltip:
    'Was this variant included in the analysis. Must have MAC ≤ 5 and is either a PTV or MPC > 2 missense variant.',
  type: 'boolean',
  accessor: (row) => row.group_result.in_analysis,
  render: (value) => (value ? 'yes' : ''),
  renderForCSV: (value) => (value ? 'yes' : ''),
  showOnDetails: false,
  showOnGenePage: true,
}

export const schemaVariantResultColumns: VariantColumnConfig<SchemaVariantRow>[] = [
  schemaVariantNDeNovoColumn,
  schemaVariantInAnalysisColumn,
]

export const schemaVariantCustomFilter: VariantCustomFilter<SchemaVariantRow> = {
  component: SCHEMAVariantFilter,
  defaultFilter: {
    onlyInAnalysis: false,
    onlyDeNovo: false,
  },
  applyFilter: (variants, { onlyDeNovo, onlyInAnalysis }) => {
    let filteredVariants = variants
    if (onlyDeNovo) {
      filteredVariants = filteredVariants.filter((v) => v.group_result.n_de_novo > 0)
    }
    if (onlyInAnalysis) {
      filteredVariants = filteredVariants.filter((v) => v.group_result.in_analysis)
    }
    return filteredVariants
  },
}

export const renderSchemaVariantAttributes: RenderVariantAttributes<SchemaVariantInfo> = ({
  misrank_percentile: misrankPercentile,
  mpc,
  alpha_missense: alphaMissense,
  misfit_s: misfitS,
  pop_eve: popEve,
}) => [
  { label: 'MisRank Percentile', content: misrankPercentile === null ? '–' : misrankPercentile },
  { label: 'MPC', content: mpc === null ? '–' : mpc },
  { label: 'AlphaMissense', content: alphaMissense === null ? '–' : alphaMissense },
  { label: 'MisFit S', content: misfitS === null ? '–' : misfitS },
  { label: 'PopEVE', content: popEve === null ? '–' : popEve },
]

const SCHEMABrowser = () => (
  <ExomeResultsBrowser
    browserTitle="SCHEMA Browser"
    navBarBackgroundColor="#0a79bf"
    homePage={SCHEMAHomePage}
    extraPages={[
      {
        path: '/about',
        label: 'About',
        component: SCHEMAAboutPage,
      },
      {
        path: '/terms',
        label: 'Terms',
        component: SCHEMATermsPage,
      },
    ]}
    geneResultsPageHeading="Exome meta-analysis results"
    geneResultAnalysisGroupOptions={schemaAnalysisGroups}
    defaultGeneResultAnalysisGroup={schemaDefaultAnalysisGroup}
    defaultGeneResultSortKey="schema_case_control_p_value"
    geneResultColumns={schemaGeneResultColumns}
    geneResultTabs={[
      {
        id: 'manhattan-plot',
        label: 'Manhattan Plot',
        render: (results) => (
          <GeneResultsManhattanPlot
            results={results}
            pValueColumn="schema_case_control_p_value"
            thresholds={[
              {
                label: 'Genome-wide significance (p = 2.2e-6)',
                value: 2.2e-6,
              },
              {
                label: 'FDR < 5% (p = 7.9e-5)',
                value: 7.9e-5,
              },
            ]}
          />
        ),
      },
      {
        id: 'qq-plot',
        label: 'QQ Plot',
        render: (results) => (
          <GeneResultsQQPlot
            results={results}
            pValueColumn="schema_case_control_p_value"
            thresholds={[
              {
                label: 'Genome-wide significance (p = 2.2e-6)',
                value: 2.2e-6,
              },
              {
                label: 'FDR < 5% (p = 7.9e-5)',
                value: 7.9e-5,
              },
            ]}
          />
        ),
      },
    ]}
    variantAnalysisGroupOptions={schemaAnalysisGroups}
    defaultVariantAnalysisGroup={schemaDefaultAnalysisGroup}
    variantResultColumns={schemaVariantResultColumns}
    variantConsequences={variantConsequences}
    variantConsequenceCategoryLabels={{
      lof: 'PTV',
      missense: 'Missense',
      synonymous: 'Synonymous',
      other: 'Other',
    }}
    variantCustomFilter={schemaVariantCustomFilter}
    renderVariantAttributes={renderSchemaVariantAttributes}
  />
)

export default SCHEMABrowser
