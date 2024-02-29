import React from 'react'

import Browser from '../base/Browser'
import { renderCount, renderFloat } from '../base/tableCells'

import IBDAboutPage from './IBDAboutPage'
import IBDHomePage from './IBDHomePage'
import IBDTermsPage from './IBDTermsPage'
import IBDVariantFilter from './IBDVariantFilter'
import vepConsequences from '../base/vepConsequences'

const variantConsequences = [...vepConsequences]

// const renderOddsRatio = (value) => {
//   if (value === null) {
//     return ''
//   }
//   if (value === 'Infinity') {
//     return '∞'
//   }
//   if (value === 0) {
//     return '0'
//   }
//   return value.toPrecision(3)
// }

const IBDBrowser = () => (
  <Browser
    browserTitle="IBD Browser"
    navBarBackgroundColor="#7b558c"
    homePage={IBDHomePage}
    extraPages={[
      {
        path: '/about',
        label: 'About',
        component: IBDAboutPage,
      },
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
          minWidth: 75,
          render: (value) => renderFloat(value),
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
    variantConsequences={variantConsequences}
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
