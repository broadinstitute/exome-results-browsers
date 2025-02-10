import React from 'react'

import Browser from '../base/Browser'
import { renderFloatAsScientific, renderFloatAsDecimal } from '../base/tableCells'

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
    geneResultsPageHeading="IBD: results by gene"
    geneResultAnalysisGroupOptions={ibdAnalysisGroups}
    defaultGeneResultAnalysisGroup={defaultIBDAnalysisGroup}
    defaultGeneResultSortKey="lof_0_001_P"
    geneResultColumns={[
      {
        key: 'lof_0_001_P',
        heading: 'LoF 0.001 P-val',
        minWidth: 110,
        render: (value) => renderFloatAsScientific(value),
      },
      {
        key: 'lof_0_001_BETA',
        heading: 'LoF 0.001 Beta',
        minWidth: 110,
        render: (value) => renderFloatAsDecimal(value),
      },
      {
        key: 'lof_missense_0_001_P',
        heading: 'LoF Missense 0.001 P-val',
        minWidth: 110,
        render: (value) => renderFloatAsScientific(value),
      },
      {
        key: 'lof_missense_0_001_BETA',
        heading: 'LoF Missense 0.001 Beta',
        minWidth: 110,
        render: (value) => renderFloatAsDecimal(value),
      },
      {
        key: 'variant_af_case',
        heading: 'Variant AF Case',
        minWidth: 110,
        render: (value) => renderFloatAsScientific(value),
      },
      {
        key: 'variant_p',
        heading: 'Variant P-val',
        minWidth: 110,
        render: (value) => renderFloatAsScientific(value),
      },
      {
        key: 'variant_beta',
        heading: 'Variant Beta',
        minWidth: 110,
        render: (value) => renderFloatAsDecimal(value),
      },
    ]}
    variantAnalysisGroupOptions={ibdAnalysisGroups}
    defaultVariantAnalysisGroup={defaultIBDAnalysisGroup}
    defaultVariantTableSortKey="group_result.p"
    defaultVariantTableSortOrder="ascending"
    variantResultColumns={[
      {
        key: 'group_result.p',
        heading: 'P\u2011Value',
        minWidth: 75,
        render: (value) => renderFloatAsScientific(value),
      },

      {
        key: 'group_result.beta',
        heading: 'Beta',
        minWidth: 65,
        render: (value) => renderFloatAsDecimal(value),
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
