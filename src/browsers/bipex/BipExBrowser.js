import React from 'react'

import Browser from '../base/Browser'
import { renderCount } from '../base/tableCells'

import BipExHomePage from './BipExHomePage'
import BipExVariantFilter from './BipExVariantFilter'

const renderOddsRatio = (value) => {
  if (value == null) {
    return ''
  }

  if (value === 'Infinity') {
    return '∞'
  }

  if (value === 0) {
    return '0'
  }

  if (isNaN(value)) {
    return 'NaN'
  }

  if (typeof value !== 'number') {
    return `[FIXME: ${typeof value} | ${String(value)}]`
  }

  // 5. Safe to call toPrecision
  return value.toPrecision(3)
}

const BipExBrowser = () => (
  <Browser
    browserTitle="BipEx: Bipolar Exomes Browser"
    navBarBackgroundColor="#c24100"
    homePage={BipExHomePage}
    geneResultsPageHeading="Gene results"
    geneResultAnalysisGroupOptions={[
      "meta",
    ]}
    defaultGeneResultAnalysisGroup="meta"
    defaultGeneResultSortKey="ptv_p_value"
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
      // ---
      {
        key: 'ptv_case_carrier',
        heading: 'PTV Case Carrier',
        minWidth: 65,
        render: renderCount,
      },
      {
        key: 'ptv_ctrl_carrier',
        heading: 'PTV Control Carrier',
        minWidth: 65,
        render: renderCount,
      },
      {
        key: 'ptv_p_value',
        heading: 'PTV p\u2011val',
        minWidth: 95,
      },
      {
        key: 'ptv_odds_ratio',
        heading: 'PTV Fisher odds ratio',
        minWidth: 85,
        render: renderOddsRatio,
      },
      // ---
      {
        key: 'mis_case_carrier',
        heading: 'MIS Case Carrier',
        minWidth: 65,
        render: renderCount,
      },
      {
        key: 'mis_ctrl_carrier',
        heading: 'MIS Control Carrier',
        minWidth: 65,
        render: renderCount,
      },
      {
        key: 'mis_p_value',
        heading: 'MIS p\u2011val',
        minWidth: 95,
      },
      {
        key: 'mis_odds_ratio',
        heading: 'MIS Fisher odds ratio',
        minWidth: 85,
        render: renderOddsRatio,
      },
      // ---
      {
        key: 'ptv_mis_case_carrier',
        heading: 'PTV+MIS Case Carrier',
        minWidth: 85,
        render: renderCount,
      },
      {
        key: 'ptv_mis_ctrl_carrier',
        heading: 'PTV+MIS Control Carrier',
        minWidth: 85,
        render: renderCount,
      },
      {
        key: 'ptv_mis_p_value',
        heading: 'PTV+MIS p\u2011val',
        minWidth: 95,
      },
      {
        key: 'ptv_mis_odds_ratio',
        heading: 'PTV+MIS Fisher odds ratio',
        minWidth: 85,
        render: renderOddsRatio,
      },
      // ---
      {
        key: 'syn_case_carrier',
        heading: 'SYN Case Carrier',
        minWidth: 85,
        render: renderCount,
      },
      {
        key: 'syn_ctrl_carrier',
        heading: 'SYN Control Carrier',
        minWidth: 85,
        render: renderCount,
      },
      {
        key: 'syn_p_value',
        heading: 'SYN p\u2011val',
        minWidth: 95,
      },
      {
        key: 'syn_odds_ratio',
        heading: 'SYN Fisher odds ratio',
        minWidth: 85,
        render: renderOddsRatio,
      },
      // ---
    ]}
    defaultVariantAnalysisGroup="meta"
    variantAnalysisGroupOptions={[
      "meta",
    ]}
    variantResultColumns={[
      {
        key: 'group_result.mac',
        heading: 'MAC',
        minWidth: 65,
      },
      {
        key: 'group_result.missense_passing',
        heading: 'Missense passing',
        minWidth: 85,
        render: (value) => (value ? 'yes' : ''),
        renderForCSV: (value) => (value ? 'yes' : ''),
      },
      {
        key: 'group_result.in_analysis',
        heading: 'In analysis',
        minWidth: 85,
        render: (value) => (value ? 'yes' : ''),
        renderForCSV: (value) => (value ? 'yes' : ''),
        showOnDetails: false,
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
