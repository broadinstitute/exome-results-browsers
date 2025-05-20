import React from 'react'

import Browser from '../base/Browser'
import { renderFloat } from '../base/tableCells'

import IBDAboutPage from './IBDAboutPage'
import IBDHomePage from './IBDHomePage'
import IBDTermsPage from './IBDTermsPage'
import IBDVariantFilter from './IBDVariantFilter'
import vepConsequences from '../base/vepConsequences'

const variantConsequences = [...vepConsequences]

const ibdAnalysisGroups = ['IBD', 'CD', 'UC']
const defaultIBDAnalysisGroup = ibdAnalysisGroups[0]

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
    geneResultAnalysisGroupOptions={ibdAnalysisGroups}
    defaultGeneResultAnalysisGroup={defaultIBDAnalysisGroup}
    defaultGeneResultSortKey="todo"
    geneResultColumns={[
      {
        key: 'lof_singleton_P',
        heading: 'lof singleton P',
        minWidth: 110,
        render: (value) => renderFloat(value),
      },
      {
        key: 'lof_missense_singleton_P',
        heading: 'lof missense singleton P',
        minWidth: 110,
        render: (value) => renderFloat(value),
      },
      {
        key: 'lof_0_001_P',
        heading: 'lof 0_001 P',
        minWidth: 110,
        render: (value) => renderFloat(value),
      },
      {
        key: 'lof_missense_0_001_P',
        heading: 'lof missense 0_001 P',
        minWidth: 110,
        render: (value) => renderFloat(value),
      },
      {
        key: 'lof_missense_0_001_BETA',
        heading: 'lof missense 0_001 beta',
        minWidth: 110,
        render: (value) => renderFloat(value),
      },
    ]}
    variantAnalysisGroupOptions={ibdAnalysisGroups}
    defaultVariantAnalysisGroup={defaultIBDAnalysisGroup}
    variantResultColumns={[
      {
        key: 'group_result.p',
        heading: 'P\u2011Value',
        minWidth: 75,
        render: (value) => renderFloat(value),
      },
      {
        key: 'group_result.chi_sq_stat',
        heading: 'χ²',
        minWidth: 65,
        render: (value) => renderFloat(value),
      },
    ]}
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
    renderVariantAttributes={({ cadd, revel, polyphen, splice_ai: spliceAi, sift }) => [
      { label: 'CADD', content: cadd === null ? '–' : cadd },
      { label: 'Revel', content: revel === null ? '–' : revel },
      { label: 'PolyPhen', content: polyphen === null ? '–' : polyphen },
      { label: 'Splice AI', content: spliceAi === null ? '–' : spliceAi },
      { label: 'Sift', content: sift === null ? '–' : sift },
    ]}
  />
)

export default IBDBrowser
