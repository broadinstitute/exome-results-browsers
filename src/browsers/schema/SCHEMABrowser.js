import React from 'react'

import ExomeResultsBrowser from '../base/Browser'
import GeneResultsManhattanPlot from '../base/GeneResultsPage/GeneResultsManhattanPlot'
import GeneResultsQQPlot from '../base/GeneResultsPage/GeneResultsQQPlot'
import { renderCount } from '../base/tableCells'
import vepConsequences from '../base/vepConsequences'

import SCHEMAAboutPage from './SCHEMAAboutPage'
import SCHEMAHomePage from './SCHEMAHomePage'
import SCHEMATermsPage from './SCHEMATermsPage'
import SCHEMAVariantFilter from './SCHEMAVariantFilter'

const variantConsequences = [...vepConsequences]
variantConsequences.splice(
  vepConsequences.findIndex(({ term }) => term === 'missense_variant'),
  1,
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
  }
)

const renderOddsRatio = (value) => {
  if (value === null) {
    return ''
  }
  if (value === 'Infinity') {
    return '∞'
  }
  if (value === 0) {
    return '0'
  }
  const float_value = parseFloat(value)
  if (isNaN(float_value)) {
    return value;
  }
  return float_value.toPrecision(3)
}

const SCHEMABrowser = () => (
  <ExomeResultsBrowser
    // browserTitle="SCHEMA browser"
    // navBarBackgroundColor="#0a79bf"
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
    defaultGeneResultSortKey="P meta"
    geneResultColumns={[
      {
        key: 'PTV Case Carrier',
        heading: 'Case PTV',
        tooltip:
          'Protein truncating variant (PTVs) or putatively loss-of-function variants: stop-gained, frameshift, and essential splice donor or acceptor variants. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'PTV Control Carrier',
        heading: 'Control PTV',
        tooltip:
          'Protein truncating variant (PTVs) or putatively loss-of-function variants: stop-gained, frameshift, and essential splice donor or acceptor variants. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'PTV + Missense Case Carrier',
        heading: 'Case PTV + Missense',
        tooltip:
          'Protein truncating variant (PTVs) or putatively loss-of-function variants: stop-gained, frameshift, and essential splice donor or acceptor variants, in addition to variants with a high MisRank percentile. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'PTV + Missense Control Carrier',
        heading: 'Control PTV + Missense',
        tooltip:
          'Protein truncating variant (PTVs) or putatively loss-of-function variants: stop-gained, frameshift, and essential splice donor or acceptor variants, in addition to variants with a high MisRank percentile. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'N de novo PTV',
        heading: 'De Novo PTV',
        tooltip: 'Determined to be de novo of origin in 3,402 parent-proband trios.',
        minWidth: 90,
        render: renderCount,
      },
      {
        key: 'N de novo PTV + Missense',
        heading: 'De Novo PTV + Missense',
        tooltip: 'Determined to be de novo of origin in 3,402 parent-proband trios.',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'Case-Control + de novo Pvalue',
        heading: 'P meta',
        tooltip: 'Study-wide meta-analysis P-value.',
        minWidth: 100,
      },
      {
        key: 'PTV OR',
        heading: 'OR PTV',
        tooltip:
          'In-sample odds ratio of PTV variants.',
        minWidth: 110,
        render: renderOddsRatio,
      },
      {
        key: 'PTV+ Missense OR',
        heading: 'OR PTV + Missense',
        tooltip:
          'In-sample odds ratio of PTV + Missense variants.',
        minWidth: 110,
        render: renderOddsRatio,
      },
    ]}
    geneResultTabs={[
      {
        id: 'manhattan-plot',
        label: 'Manhattan Plot',
        render: (results) => (
          <GeneResultsManhattanPlot
            results={results}
            pValueColumn="Case-Control + de novo Pvalue"
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
            pValueColumn="Case-Control + de novo Pvalue"
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
      // {
      //   key: 'group_result.source',
      //   heading: 'Source',
      //   render: (value) => value,
      //   showOnGenePage: false,
      // },
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
          filteredVariants = filteredVariants.filter((v) => v.group_result.n_denovos > 0)
        }
        if (onlyInAnalysis) {
          filteredVariants = filteredVariants.filter((v) => v.group_result.in_analysis)
        }
        return filteredVariants
      },
    }}
    renderVariantAttributes={({ misrank_percentile: misrankPercentile, mpc, alpha_missense: alphaMissense, misfit_s: misfitS, pop_eve: popEve }) => [
      { label: 'MisRank Percentile', content: misrankPercentile === null ? '–' : misrankPercentile },
      { label: 'MPC', content: mpc === null ? '–' : mpc },
      { label: 'AlphaMissense', content: alphaMissense === null ? '–' : alphaMissense },
      { label: 'MisFit S', content: misfitS === null ? '–' : misfitS },
      { label: 'PopEVE', content: popEve === null ? '–' : popEve },
    ]}
  />
)

export default SCHEMABrowser
