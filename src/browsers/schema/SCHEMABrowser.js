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
  return value.toPrecision(3)
}

const SCHEMABrowser = () => (
  <ExomeResultsBrowser
    browserTitle="SCHEMA browser"
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
    geneResultAnalysisGroupOptions={['meta']}
    defaultGeneResultAnalysisGroup="meta"
    defaultGeneResultSortKey="P meta"
    geneResultColumns={[
      {
        key: 'Case PTV',
        heading: 'Case PTV',
        tooltip:
          'Protein truncating variant (PTVs) or putatively loss-of-function variants: stop-gained, frameshift, and essential splice donor or acceptor variants. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'Ctrl PTV',
        heading: 'Control PTV',
        tooltip:
          'Protein truncating variant (PTVs) or putatively loss-of-function variants: stop-gained, frameshift, and essential splice donor or acceptor variants. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'Case mis3',
        heading: 'Case Missense (MPC\u00a0≥\u00a03)',
        tooltip:
          'MPC-prioritized missense variants: missense variants with an MPC score above the described threshold. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'Ctrl mis3',
        heading: 'Control Missense (MPC\u00a0≥\u00a03)',
        tooltip:
          'MPC-prioritized missense variants: missense variants with an MPC score above the described threshold. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'Case mis2',
        heading: 'Case Missense (2\u00a0≤\u00a0MPC\u00a0<\u00a03)',
        tooltip:
          'MPC-prioritized missense variants: missense variants with an MPC score in the described range. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 110,
        render: renderCount,
      },
      {
        key: 'Ctrl mis2',
        heading: 'Control Missense (2\u00a0≤\u00a0MPC\u00a0<\u00a03)',
        tooltip:
          'MPC-prioritized missense variants: missense variants with an MPC score in the described range. Aggregated counts from variants with minor allele count [MAC] ≤ 5.',
        minWidth: 110,
        render: renderCount,
      },
      {
        key: 'De novo PTV',
        tooltip: 'Determined to be de novo of origin in 3,402 parent-proband trios.',
        minWidth: 90,
        render: renderCount,
      },
      {
        key: 'De novo mis3',
        heading: 'De Novo Missense (MPC\u00a0≥\u00a03)',
        tooltip: 'Determined to be de novo of origin in 3,402 parent-proband trios.',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'De novo mis2',
        heading: 'De Novo Missense (2\u00a0≤\u00a0MPC\u00a0<\u00a03)',
        tooltip: 'Determined to be de novo of origin in 3,402 parent-proband trios.',
        minWidth: 110,
        render: renderCount,
      },
      {
        key: 'P meta',
        tooltip: 'Study-wide meta-analysis P-value.',
        minWidth: 100,
      },
      {
        key: 'Q meta',
        tooltip: 'P-value adjusted for the False Discovery Rate.',
        minWidth: 100,
      },
      {
        key: 'OR (Class I)',
        heading: 'OR (Class\u00a0I)',
        tooltip:
          'In-sample odds ratio of Class I variants, defined as PTVs and MPC > 3 missense variants.',
        minWidth: 110,
        render: renderOddsRatio,
      },
      {
        key: 'OR (Class II)',
        heading: 'OR (Class\u00a0II)',
        tooltip:
          'In-sample odds ratio of Class II variants, defined as MPC 2 - 3 missense variants.',
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
            pValueColumn="P meta"
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
            pValueColumn="P meta"
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
        key: 'group_result.n_denovos',
        heading: 'No. de novos',
        minWidth: 80,
        type: 'int',
        tooltip: 'Out of AC case, the number of genotypes determined to de novo in origin.',
      },
      {
        key: 'group_result.p',
        heading: 'P-Val',
        minWidth: 65,
        tooltip: 'P-value from single variant association testing.',
      },
      {
        key: 'group_result.est',
        heading: 'Estimate',
        minWidth: 80,
        tooltip: 'Effect size from single variant association testing.',
      },
      {
        key: 'group_result.se',
        heading: 'SE',
        showOnGenePage: false,
      },
      {
        key: 'group_result.qp',
        heading: 'Qp',
        showOnGenePage: false,
      },
      {
        key: 'group_result.i2',
        heading: 'I2',
        showOnGenePage: false,
      },
      {
        key: 'group_result.source',
        heading: 'Source',
        render: (value) => value,
        showOnGenePage: false,
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
          filteredVariants = filteredVariants.filter((v) => v.group_result.n_denovos > 0)
        }
        if (onlyInAnalysis) {
          filteredVariants = filteredVariants.filter((v) => v.group_result.in_analysis)
        }
        return filteredVariants
      },
    }}
    renderVariantAttributes={({ cadd, mpc, polyphen }) => [
      { label: 'PolyPhen', content: polyphen === null ? '–' : polyphen },
      { label: 'MPC', content: mpc === null ? '–' : mpc },
      { label: 'CADD', content: cadd === null ? '–' : cadd },
    ]}
  />
)

export default SCHEMABrowser
