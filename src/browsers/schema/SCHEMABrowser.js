import React from 'react'

import ExomeResultsBrowser from '../base/Browser'
import GeneResultsManhattanPlot from '../base/GeneResultsPage/GeneResultsManhattanPlot'
import GeneResultsQQPlot from '../base/GeneResultsPage/GeneResultsQQPlot'
import { renderCount } from '../base/tableCells'

import SCHEMAHomePage from './SCHEMAHomePage'
import SCHEMAVariantFilter from './SCHEMAVariantFilter'

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
    geneResultsPageHeading="Exome meta-analysis results"
    geneResultAnalysisGroupOptions={['meta']}
    defaultGeneResultAnalysisGroup="meta"
    defaultGeneResultSortKey="P meta"
    geneResultColumns={[
      {
        key: 'Case PTV',
        heading: 'Case PTV',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'Ctrl PTV',
        heading: 'Control PTV',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'Case mis3',
        heading: 'Case Missense (MPC\u00a0≥\u00a03)',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'Ctrl mis3',
        heading: 'Control Missense (MPC\u00a0≥\u00a03)',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'Case mis2',
        heading: 'Case Missense (2\u00a0≤\u00a0MPC\u00a0<\u00a03)',
        minWidth: 110,
        render: renderCount,
      },
      {
        key: 'Ctrl mis2',
        heading: 'Control Missense (2\u00a0≤\u00a0MPC\u00a0<\u00a03)',
        minWidth: 110,
        render: renderCount,
      },
      {
        key: 'De novo PTV',
        minWidth: 90,
        render: renderCount,
      },
      {
        key: 'De novo mis3',
        heading: 'De Novo Missense (MPC\u00a0≥\u00a03)',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'De novo mis2',
        heading: 'De Novo Missense (2\u00a0≤\u00a0MPC\u00a0<\u00a03)',
        minWidth: 110,
        render: renderCount,
      },
      {
        key: 'P meta',
        minWidth: 100,
      },
      {
        key: 'Q meta',
        minWidth: 100,
      },
      {
        key: 'OR (Class I)',
        heading: 'OR (Class\u00a0I)',
        minWidth: 110,
        render: renderOddsRatio,
      },
      {
        key: 'OR (Class II)',
        heading: 'OR (Class\u00a0II)',
        minWidth: 110,
        render: renderOddsRatio,
      },
    ]}
    geneResultTabs={[
      {
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
        tooltip: 'Number of genotypes determined to de novo in origin.',
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
        tooltip: 'Was this variant used in gene burden analysis.',
        type: 'boolean',
        render: (value) => (value ? 'yes' : ''),
        renderForCSV: (value) => (value ? 'yes' : ''),
        showOnDetails: false,
        showOnGenePage: true,
      },
    ]}
    variantConsequences={[
      {
        term: 'lof',
        label: 'loss of function',
        category: 'lof',
      },
      {
        term: 'stoplost',
        label: 'stop lost',
        category: 'missense',
      },
      {
        term: 'startlost',
        label: 'start lost',
        category: 'missense',
      },
      {
        term: 'mis',
        label: 'missense (MPC\u00a0<\u00a02)',
        category: 'missense',
      },
      {
        term: 'mis2',
        label: 'missense (2\u00a0≤\u00a0MPC\u00a0<\u00a03)',
        category: 'missense',
      },
      {
        term: 'mis3',
        label: 'missense (MPC\u00a0≥\u00a03)',
        category: 'missense',
      },
      {
        term: 'ns',
        label: 'inframe indel',
        category: 'missense',
      },
      {
        term: 'syn',
        label: 'synonymous',
        category: 'synonymous',
      },
      {
        term: 'splice',
        label: 'splice region',
        category: 'other',
      },
    ]}
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
