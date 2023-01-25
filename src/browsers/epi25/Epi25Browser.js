import React from 'react'

import Browser from '../base/Browser'
import { renderCount } from '../base/tableCells'

import Epi25HomePage from './Epi25HomePage'
import Epi25TermsPage from './Epi25TermsPage'
import Epi25VariantFilter from './Epi25VariantFilter'

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

const Epi25Browser = () => (
  <Browser
    browserTitle="Epi25 WES Browser"
    navBarBackgroundColor="#4e3c81"
    homePage={Epi25HomePage}
    extraPages={[
      {
        path: '/terms',
        label: 'Terms',
        component: Epi25TermsPage,
      },
    ]}
    geneResultsPageHeading="Epi25 WES: gene burden results"
    geneResultAnalysisGroupOptions={['EPI', 'DEE', 'GGE', 'NAFE']}
    defaultGeneResultAnalysisGroup="EPI"
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
    defaultVariantAnalysisGroup="EPI"
    variantAnalysisGroupOptions={['EPI', 'DEE', 'GGE', 'NAFE']}
    variantResultColumns={[
      {
        key: 'group_result.estimate',
        heading: 'Estimate',
        minWidth: 80,
      },
      {
        key: 'group_result.chi_sq_stat',
        heading: 'χ²',
        minWidth: 65,
      },
      {
        key: 'group_result.p_value',
        heading: 'P\u2011Value',
        minWidth: 65,
      },
      {
        key: 'group_result.in_analysis',
        heading: 'In Analysis',
        minWidth: 85,
        tooltip: 'Was this variant used in gene burden analysis.',
        render: (value) => (value ? 'yes' : ''),
        renderForCSV: (value) => (value ? 'yes' : ''),
        showOnDetails: false,
      },
    ]}
    variantConsequences={[
      {
        term: 'damaging_missense',
        label: 'Damaging Missense',
        category: 'missense',
      },
      {
        term: 'non_coding',
        label: 'Non-coding',
        category: 'other',
      },
      {
        term: 'other_missense',
        label: 'Other Missense',
        category: 'missense',
      },
      {
        term: 'pLoF',
        label: 'Protein-truncating',
        category: 'lof',
      },
      {
        term: 'synonymous',
        label: 'Synonymous',
        category: 'synonymous',
      },
      {
        term: 'NA',
        label: '',
        category: 'other',
      },
    ]}
    variantCustomFilter={{
      component: Epi25VariantFilter,
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

export default Epi25Browser
