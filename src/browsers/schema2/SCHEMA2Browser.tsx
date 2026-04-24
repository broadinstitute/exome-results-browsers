import React from 'react'

import ExomeResultsBrowser from '../base/Browser'
import GeneResultsManhattanPlot from '../base/GeneResultsPage/GeneResultsManhattanPlot'
import GeneResultsQQPlot from '../base/GeneResultsPage/GeneResultsQQPlot'
import { renderCount, renderStringOrFloatPvalueAsScientific } from '../base/tableCells'
import vepConsequences from '../base/vepConsequences'

import SCHEMAAboutPage from './SCHEMA2AboutPage'
import SCHEMAHomePage from './SCHEMA2HomePage'
import SCHEMATermsPage from './SCHEMA2TermsPage'
import SCHEMAVariantFilter from './SCHEMA2VariantFilter'

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

const renderOddsRatio = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return ''
  }
  if (value === 'Infinity') {
    return '∞'
  }
  if (value === 0) {
    return '0'
  }
  const floatValue = typeof value == 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }
  return floatValue.toPrecision(3)
}

const SCHEMABrowser = () => (
  <ExomeResultsBrowser
    browserTitle="SCHEMA2 demo"
    navBarBackgroundColor="#ff9900"
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
    geneResultAnalysisGroupOptions={['meta']}
    defaultGeneResultAnalysisGroup="meta"
    defaultGeneResultSortKey="schema_case_control_p_value"
    geneResultColumns={[
      {
        key: 'ptv_case_carrier',
        heading: 'Case PTV',
        tooltip:
          'Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites. Aggregated counts from variants with minor allele count [MAC] <= 15',
        minWidth: 70,
        render: (value) => renderCount(value),
      },
      {
        key: 'ptv_control_carrier',
        heading: 'Control PTV',
        tooltip:
          'Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites. Aggregated counts from variants with minor allele count [MAC] <= 15',
        minWidth: 70,
        render: (value) => renderCount(value),
      },
      {
        key: 'ptv_mis_case_carrier',
        heading: 'Case PTV + Missense',
        tooltip:
          'Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites, and missense variants predicted to be damaging (mean missense rank percentile >= 93%). Aggregated counts from variants with minor allele count [MAC] <= 15',
        minWidth: 100,
        render: (value) => renderCount(value),
      },
      {
        key: 'ptv_mis_control_carrier',
        heading: 'Control PTV + Missense',
        tooltip:
          'Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites, and missense variants predicted to be damaging (mean missense rank percentile >= 93%). Aggregated counts from variants with minor allele count [MAC] <= 15',
        minWidth: 100,
        render: (value) => renderCount(value),
      },
      {
        key: 'ptv_n_de_novo',
        heading: 'De Novo PTV',
        tooltip: 'Determined to be de novo of origin in 3,402 parent-proband trios.',
        minWidth: 90,
        render: (value) => renderCount(value),
      },
      {
        key: 'ptv_mis_n_de_novo',
        heading: 'De Novo PTV + Missense',
        tooltip: 'Determined to be de novo of origin in 3,402 parent-proband trios.',
        minWidth: 100,
        render: (value) => renderCount(value),
      },
      {
        key: 'schema_case_control_p_value',
        heading: 'Case-Control SCHEMA2 P-value',
        tooltip:
          'SCHEMA2 p-value of the CMH p-value from PTV burden and the CMH p-value from PTV + missense burden.',
        minWidth: 100,
        render: (value) => renderStringOrFloatPvalueAsScientific(value),
      },
      {
        key: 'case_control_plus_de_novo_p_value',
        heading: 'Case-Control + de novo P-value',
        tooltip:
          'Weighted meta-analysis p-value combining the Case-Control SCHEMA2 p-value with the De Novo pvalue',
        minWidth: 100,
        render: (value) => renderStringOrFloatPvalueAsScientific(value),
      },
      {
        key: 'ptv_odds_ratio',
        heading: 'OR PTV',
        tooltip: 'Odds Ratio: The relative increase in schizophrenia risk associated with PTVs.',
        minWidth: 110,
        render: (value) => renderOddsRatio(value),
      },
      {
        key: 'ptv_mis_odds_ratio',
        heading: 'OR PTV + Missense',
        tooltip:
          'Odds Ratio: The relative increase in schizophrenia risk associated with PTVs + missense variants predicted to be damaging.',
        minWidth: 110,
        render: (value) => renderOddsRatio(value),
      },
    ]}
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
    defaultVariantAnalysisGroup="meta"
    variantAnalysisGroupOptions={['meta']}
    variantResultColumns={[
      {
        key: 'group_result.n_de_novo',
        heading: 'No. de novos',
        minWidth: 80,
        type: 'int',
        tooltip: 'Out of AC case, the number of genotypes determined to de novo in origin.',
      },
      {
        key: 'group_result.in_analysis',
        heading: 'In Analysis',
        minWidth: 85,
        tooltip:
          'Was this variant included in the analysis. Must have MAC ≤ 5 and is either a PTV or MPC > 2 missense variant.',
        type: 'boolean',
        render: (value) => (value ? 'yes' : ''),
        renderForCSV: (value) => (value ? 'yes' : ''),
        showOnDetails: false,
        showOnGenePage: true,
      },
    ]}
    variantConsequences={variantConsequences}
    variantConsequenceCategoryLabels={{
      lof: 'PTV',
      missense: 'Missense',
      synonymous: 'Synonymous',
      other: 'Other',
    }}
    variantCustomFilter={{
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
    }}
    renderVariantAttributes={({
      misrank_percentile: misrankPercentile,
      mpc,
      alpha_missense: alphaMissense,
      misfit_s: misfitS,
      pop_eve: popEve,
    }) => [
        {
          label: 'MisRank Percentile',
          content: misrankPercentile === null ? '–' : misrankPercentile,
        },
        { label: 'MPC', content: mpc === null ? '–' : mpc },
        { label: 'AlphaMissense', content: alphaMissense === null ? '–' : alphaMissense },
        { label: 'MisFit S', content: misfitS === null ? '–' : misfitS },
        { label: 'PopEVE', content: popEve === null ? '–' : popEve },
      ]}
  />
)

export default SCHEMABrowser
