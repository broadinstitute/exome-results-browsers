import React from 'react'

import Browser from '../base/Browser'
import { renderCount } from '../base/tableCells'

import GP2AboutPage from './GP2AboutPage'
import GP2HomePage from './GP2HomePage'
import GP2VariantFilter from './GP2VariantFilter'

import vepConsequences from '../base/vepConsequences'

const variantConsequences = [...vepConsequences]

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

const GP2Browser = () => (
  <Browser
    browerTitle="GP2 Browser"
    navBarBackgroundColor="#7b558c"
    homePage={GP2HomePage}
    extraPages={[
      {
        path: '/about',
        label: 'About',
        component: GP2AboutPage,
      },
    ]}
    geneResultsPageHeading="GP2: gene burden results"
    // TODO: change this, these are b/c we're using Epi25 gene results rn
    //
    geneResultsAnalysisGroupOptions={[
      'AAC',
      'CAH',
      'MDE',
      'AMR',
      'CAS',
      'EUR',
      'EAS',
      'SAS',
      'AJ',
      'FIN',
      'AFR',
    ]}
    defaultGeneResultAnalysisGroup="EUR"
    defaultGeneResultSortKey="ptv_pval"
    geneResultColumns={[
      {
        key: 'n_cases',
        heading: 'Cases',
        minWidth: 90,
        render: renderCount,
      },
      {
        key: 'n_controls',
        heading: 'Controls',
        minWidth: 90,
        render: renderCount,
      },
      {
        key: 'ptv_case_count',
        heading: 'PTV Case Count',
        minWidth: 65,
        render: renderCount,
      },
      {
        key: 'ptv_control_count',
        heading: 'PTV Control Count',
        minWidth: 65,
        render: renderCount,
      },
      {
        key: 'ptv_pval',
        heading: 'PTV p\u2011val',
        minWidth: 85,
      },
      {
        key: 'ptv_OR',
        heading: 'PTV odds ratio',
        minWidth: 85,
        render: renderOddsRatio,
      },
      {
        key: 'damaging_missense_case_count',
        heading: 'Damaging Missense Case Count',
        minWidth: 85,
        render: renderCount,
      },
      {
        key: 'damaging_missense_control_count',
        heading: 'Damaging Missense Control Count',
        minWidth: 85,
        render: renderCount,
      },
      {
        key: 'damaging_missense_pval',
        heading: 'Damaging Missense p\u2011val',
        minWidth: 85,
      },
      {
        key: 'damaging_missense_OR',
        heading: 'Damaging Missense odds ratio',
        minWidth: 85,
        render: renderOddsRatio,
      },
    ]}
    variantAnalysisGroupOptions={[
      'AAC',
      'CAH',
      'MDE',
      'AMR',
      'CAS',
      'EUR',
      'EAS',
      'SAS',
      'AJ',
      'FIN',
      'AFR',
    ]}
    defaultVariantAnalysisGroup="EUR"
    variantResultColumns={[
      {
        key: 'group_result.ac_case',
        heading: 'p\u2011Value',
        minWidth: 75,
        render: () => 'n/a',
      },
    ]}
    variantConsequences={variantConsequences}
    variantCustomFilter={{
      component: GP2VariantFilter,
      defaultFilter: {
        onlyInAnalysis: false,
      },
      applyFilter: (variants, { onlyInAnalysis }) => {
        if (onlyInAnalysis) {
          return variants.filter((variant) => variant.group_result.in_analysis)
        }
        return variants
      },
    }}
    renderVariantAttributes={({ cadd }) => [{ label: 'CADD', content: cadd === null ? '-' : cadd }]}
  />
)

export default GP2Browser
