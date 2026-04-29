import React from 'react'

import Browser from '../base/Browser'
import { renderCount, renderFloatAsScientific } from '../base/tableCells'

import BipExHomePage from './BipEx2HomePage'
import BipExVariantFilter from './BipEx2VariantFilter'

// @ts-expect-error: no types in this version of @gnomad/ui
import { TooltipAnchor, TooltipHint } from '@gnomad/ui'

const renderOddsRatio = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return ''
  }

  if (value === 'Infinity') {
    return '∞'
  }

  if (value === 0) {
    return '0'
  }

  if (value === 'NaN' || Number.isNaN(value)) {
    return '-'
  }

  if (typeof value !== 'number') {
    return `[FIXME: ${typeof value} | ${String(value)}]`
  }

  return value.toPrecision(3)
}

const renderBipexFlags = (value: string) => {
  const flagsArray = value.split(',')

  if (flagsArray.length === 0) {
    return ''
  }

  if (flagsArray.indexOf('bonferonni_significant') !== -1) {
    return (
      <TooltipAnchor tooltip="This gene's missense + protein truncating P-value fell into a range making it Bonferroni significant">
        <TooltipHint>Bonferroni</TooltipHint>
      </TooltipAnchor>
    )
  } else if (flagsArray.indexOf('fdr_five_percent_significant') !== -1) {
    return (
      <TooltipAnchor tooltip="This gene's missense + protein truncating P-value fell into a range making it FDR 5% significant">
        <TooltipHint>FDR 5%</TooltipHint>
      </TooltipAnchor>
    )
  }

  return ''
}

const pValueOfZeroPlaceholder = '0'

const BipExBrowser = () => (
  <Browser
    browserTitle="DEMO - BipEx2"
    navBarBackgroundColor="#a6694b"
    homePage={BipExHomePage}
    geneResultsPageHeading="Gene results"
    geneResultAnalysisGroupOptions={['meta']}
    defaultGeneResultAnalysisGroup="meta"
    defaultGeneResultSortKey="ptv_mis_p_value"
    geneResultColumns={[
      {
        key: 'n_cases',
        heading: 'Cases',
        minWidth: 90,
        render: (value) => renderCount(value),
      },
      {
        key: 'n_controls',
        heading: 'Controls',
        minWidth: 90,
        render: (value) => renderCount(value),
      },
      // ---
      {
        key: 'flags',
        heading: 'Flags',
        minWidth: 90,
        render: (value) => renderBipexFlags(value),
      },
      // ---
      {
        key: 'ptv_mis_case_carrier',
        heading: 'PTV+MIS Case Carrier',
        minWidth: 85,
        render: (value) => renderCount(value),
      },
      {
        key: 'ptv_mis_ctrl_carrier',
        heading: 'PTV+MIS Control Carrier',
        minWidth: 85,
        render: (value) => renderCount(value),
      },
      {
        key: 'ptv_mis_p_value',
        heading: 'PTV+MIS p\u2011val',
        minWidth: 95,
        render: (value) => renderFloatAsScientific(value, pValueOfZeroPlaceholder),
      },
      {
        key: 'ptv_mis_odds_ratio',
        heading: 'PTV+MIS Fisher odds ratio',
        minWidth: 85,
        render: (value) => renderOddsRatio(value),
      },
      // ---
      {
        key: 'ptv_case_carrier',
        heading: 'PTV Case Carrier',
        minWidth: 65,
        render: (value) => renderCount(value),
      },
      {
        key: 'ptv_ctrl_carrier',
        heading: 'PTV Control Carrier',
        minWidth: 65,
        render: (value) => renderCount(value),
      },
      {
        key: 'ptv_p_value',
        heading: 'PTV p\u2011val',
        minWidth: 95,
        render: (value) => renderFloatAsScientific(value, pValueOfZeroPlaceholder),
      },
      {
        key: 'ptv_odds_ratio',
        heading: 'PTV Fisher odds ratio',
        minWidth: 85,
        render: (value) => renderOddsRatio(value),
      },
      // ---
      {
        key: 'mis_case_carrier',
        heading: 'MIS Case Carrier',
        minWidth: 65,
        render: (value) => renderCount(value),
      },
      {
        key: 'mis_ctrl_carrier',
        heading: 'MIS Control Carrier',
        minWidth: 65,
        render: (value) => renderCount(value),
      },
      {
        key: 'mis_p_value',
        heading: 'MIS p\u2011val',
        minWidth: 95,
        render: (value) => renderFloatAsScientific(value, pValueOfZeroPlaceholder),
      },
      {
        key: 'mis_odds_ratio',
        heading: 'MIS Fisher odds ratio',
        minWidth: 85,
        render: (value) => renderOddsRatio(value),
      },
      // ---
      {
        key: 'syn_case_carrier',
        heading: 'SYN Case Carrier',
        minWidth: 85,
        render: (value) => renderCount(value),
      },
      {
        key: 'syn_ctrl_carrier',
        heading: 'SYN Control Carrier',
        minWidth: 85,
        render: (value) => renderCount(value),
      },
      {
        key: 'syn_p_value',
        heading: 'SYN p\u2011val',
        minWidth: 95,
        render: (value) => renderFloatAsScientific(value, pValueOfZeroPlaceholder),
      },
      {
        key: 'syn_odds_ratio',
        heading: 'SYN Fisher odds ratio',
        minWidth: 85,
        render: (value) => renderOddsRatio(value),
      },
    ]}
    defaultVariantAnalysisGroup="meta"
    variantAnalysisGroupOptions={['meta']}
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
