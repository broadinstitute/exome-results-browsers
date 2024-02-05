import React from 'react'

import Browser from '../base/Browser'
import { renderCount } from '../base/tableCells'

import IBDHomePage from './IBDHomePage'
import IBDTermsPage from './IBDTermsPage'
import IBDVariantFilter from './IBDVariantFilter'

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

const IBDBrowser = () => (
  <Browser
    browserTitle="IBD Browser"
    navBarBackgroundColor="#4e3c81"
    homePage={IBDHomePage}
    extraPages={[
      {
        path: '/terms',
        label: 'Terms',
        component: IBDTermsPage,
      },
    ]}
    geneResultsPageHeading="IBD: gene burden results"
    // TODO:
    geneResultAnalysisGroupOptions={['cd', 'ibd', 'uc']}
    defaultGeneResultAnalysisGroup="ibd"
    defaultGeneResultSortKey="todo"
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
      // TODO: add more below
      {
        key: 'lof_missense_0_001_P',
        heading: 'lof missense P',
        minWidth: 110,
        render: renderCount,
      },
      {
        key: 'lof_missense_0_001_BETA',
        heading: 'lof missense beta',
        minWidth: 110,
        render: renderCount,
      },
      // TODO: add more above
    ]}
    // TODO:
    defaultVariantAnalysisGroup="ibd-control"
    variantAnalysisGroupOptions={['cd-control', 'ibd-control', 'uc-control']}
    variantResultColumns={
      [
        {
          key: 'group_result.p',
          heading: 'P\u2011Value',
          minWidth: 65,
        },
      ]
      //   [
      //   {
      //     key: 'group_result.estimate',
      //     heading: 'Estimate',
      //     minWidth: 80,
      //   },
      //   {
      //     key: 'group_result.chi_sq_stat',
      //     heading: 'χ²',
      //     minWidth: 65,
      //   },
      //   {
      //     key: 'group_result.p_value',
      //     heading: 'P\u2011Value',
      //     minWidth: 65,
      //   },
      //   {
      //     key: 'group_result.in_analysis',
      //     heading: 'In Analysis',
      //     minWidth: 85,
      //     tooltip: 'Was this variant used in gene burden analysis.',
      //     render: (value) => (value ? 'yes' : ''),
      //     renderForCSV: (value) => (value ? 'yes' : ''),
      //     showOnDetails: false,
      //   },
      // ]
    }
    variantConsequences={
      [{ term: 'missense_variant', label: 'Missense variant', category: 'missense' }]
      //   [
      //   {
      //     term: 'damaging_missense',
      //     label: 'Damaging Missense',
      //     category: 'missense',
      //   },
      //   {
      //     term: 'non_coding',
      //     label: 'Non-coding',
      //     category: 'other',
      //   },
      //   {
      //     term: 'other_missense',
      //     label: 'Other Missense',
      //     category: 'missense',
      //   },
      //   {
      //     term: 'pLoF',
      //     label: 'Protein-truncating',
      //     category: 'lof',
      //   },
      //   {
      //     term: 'synonymous',
      //     label: 'Synonymous',
      //     category: 'synonymous',
      //   },
      //   {
      //     term: 'NA',
      //     label: '',
      //     category: 'other',
      //   },
      // ]
    }
    variantCustomFilter={{
      component: IBDVariantFilter,
      defaultFilter: {
        onlyInAnalysis: false,
      },
      applyFilter: (variants, { onlyInAnalysis }) => {
        if (onlyInAnalysis) {
          return variants.filter((v) => v.group_result.in_analysis)
        }
        return variants
      },
    }}
    renderVariantAttributes={({ cadd, mpc, polyphen }) => [
      { label: 'PolyPhen', content: polyphen === null ? '–' : polyphen },
      { label: 'MPC', content: mpc === null ? '–' : mpc },
      { label: 'CADD', content: cadd === null ? '–' : cadd },
    ]}
  />
)

export default IBDBrowser
