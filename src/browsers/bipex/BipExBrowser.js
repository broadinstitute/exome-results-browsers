import React from 'react'

import Browser from '../base/Browser'
import { renderCount } from '../base/tableCells'

import BipExHomePage from './BipExHomePage'
import BipExVariantFilter from './BipExVariantFilter'

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

const BipExBrowser = () => (
  <Browser
    browserTitle="BipEx: Bipolar Exomes Browser"
    navBarBackgroundColor="#c24100"
    homePage={BipExHomePage}
    geneResultsPageHeading="Gene results"
    geneResultAnalysisGroupOptions={[
      'Bipolar Disorder',
      'Bipolar Disorder 1',
      'Bipolar Disorder 2',
      'Bipolar Disorder with Psychosis',
      'Bipolar Disorder without Psychosis',
      'Bipolar Disorder (including Schizoaffective)',
    ]}
    defaultGeneResultAnalysisGroup="Bipolar Disorder"
    defaultGeneResultSortKey="ptv_fisher_gnom_non_psych_pval"
    geneResultColumns={[
      {
        key: 'n_cases',
        heading: 'Cases',
        minWidth: 80,
        render: renderCount,
      },
      {
        key: 'n_controls',
        heading: 'Controls',
        minWidth: 80,
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
        key: 'ptv_fisher_gnom_non_psych_pval',
        heading: 'PTV Fisher p\u2011val',
        minWidth: 85,
      },
      {
        key: 'ptv_fisher_gnom_non_psych_OR',
        heading: 'PTV Fisher odds ratio',
        minWidth: 85,
        render: renderOddsRatio,
      },
      {
        key: 'damaging_missense_case_count',
        heading: 'Damaging Missense Case Count',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'damaging_missense_control_count',
        heading: 'Damaging Missense Control Count',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'damaging_missense_fisher_gnom_non_psych_pval',
        heading: 'Damaging Missense Fisher p\u2011val',
        minWidth: 85,
      },
      {
        key: 'damaging_missense_fisher_gnom_non_psych_OR',
        heading: 'Damaging Missense Fisher odds ratio',
        minWidth: 85,
        render: renderOddsRatio,
      },
    ]}
    defaultVariantAnalysisGroup="Bipolar Disorder"
    variantAnalysisGroupOptions={[
      'Bipolar Disorder',
      'Bipolar Disorder 1',
      'Bipolar Disorder 2',
      'Bipolar Disorder with Psychosis',
      'Bipolar Disorder without Psychosis',
      'Bipolar Disorder (including Schizoaffective)',
    ]}
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
        term: 'ptv',
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
      component: BipExVariantFilter,
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

export default BipExBrowser
