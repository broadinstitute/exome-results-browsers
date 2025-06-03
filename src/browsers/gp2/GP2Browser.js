import React from 'react'

import Browser from '../base/Browser'
import { renderCount } from '../base/tableCells'

import GP2AboutPage from './GP2AboutPage'
import GP2HomePage from './GP2HomePage'
import GP2VariantFilter from './GP2VariantFilter'
import GP2TermsPage from './GP2TermsPage'

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

const GP2Browser = () => {
  // FIXME: these analysis groups are relevant to the temp
  //   Epi25 data we're using to populate the sparce
  //   demo browser with only GP2 variant results
  // This should be updated when we get Gene results
  const analysisGroups = [
    'EUR',
    'AAC',
    'CAH',
    'MDE',
    'AMR',
    'CAS',
    'EAS',
    'SAS',
    'AJ',
    'FIN',
    'AFR',
  ]

  const geneResultColumns = [
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
  ]

  return (
    <Browser
      browerTitle="GP2 Browser"
      navBarBackgroundColor="#995400"
      homePage={GP2HomePage}
      extraPages={[
        {
          path: '/about',
          label: 'About',
          component: GP2AboutPage,
        },
        {
          path: '/terms',
          label: 'Terms',
          component: GP2TermsPage,
        },
      ]}
      geneResultsPageHeading="GP2: gene burden results"
      geneResultsAnalysisGroupOptions={analysisGroups}
      defaultGeneResultAnalysisGroup="EUR"
      defaultGeneResultSortKey="ptv_pval"
      geneResultColumns={geneResultColumns}
      variantAnalysisGroupOptions={analysisGroups}
      defaultVariantAnalysisGroup="EUR"
      variantResultColumns={[
        {
          key: 'group_result.dataset',
          heading: 'P\u2011Value',
          minWidth: 75,
          render: () => 'n/a',
        },
        {
          key: 'group_result.dataset',
          heading: 'Dataset',
          minWidth: 75,
          render: (value) => value,
        },
      ]}
      variantConsequences={variantConsequences}
      renderVariantAttributes={({ cadd }) => [
        { label: 'CADD', content: cadd === null ? '-' : cadd },
      ]}
    />
  )
}

export default GP2Browser
