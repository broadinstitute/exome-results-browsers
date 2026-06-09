import React from 'react'

import Browser from '../base/Browser'
import { renderStringOrFloatAsDecimal, renderStringOrFloatPvalueAsScientific } from '../base/tableCells'

import IBDAboutPage from './IBDAboutPage'
import IBDHomePage from './IBDHomePage'
import IBDTermsPage from './IBDTermsPage'
import vepConsequences from '../base/vepConsequences'

const variantConsequences = [...vepConsequences]

export const ibdAnalysisGroups = ['IBD', 'CD', 'UC'] as const
export type IBDAnalysisGroup = typeof ibdAnalysisGroups[number]
export const ibdDefaultAnalysisGroup: IBDAnalysisGroup = 'IBD'

export const ibdPValueOfZeroPlaceholder = '<1e-300'
export const ibdBetaValueOfZeroPlaceholder = '0'

const IBDBrowser = () => {
  return (
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
      defaultGeneResultAnalysisGroup={ibdDefaultAnalysisGroup}
      defaultGeneResultSortKey="ptv_0_001_P_meta"
      geneResultColumns={[
        {
          key: 'variant_p_meta',
          heading: 'Variant P-val',
          minWidth: 110,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'variant_beta_meta',
          heading: 'Variant Beta',
          minWidth: 110,
          render: (value) => renderStringOrFloatAsDecimal({ value: value }),
        },
        {
          key: 'variant_af_case',
          heading: 'Variant AF Case',
          minWidth: 110,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: '0' }),
        },
        {
          key: 'ptv_0_001_P_meta',
          heading: 'PTV 0.001 P-val',
          minWidth: 110,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'ptv_0_001_beta_meta',
          heading: 'PTV 0.001 Beta',
          minWidth: 110,
          render: (value) => renderStringOrFloatAsDecimal({ value: value }),
        },
        {
          key: 'nsyn_0_001_P_meta',
          heading: 'Nsyn 0.001 P-val',
          minWidth: 110,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'nsyn_0_001_beta_meta',
          heading: 'Nsyn 0.001 Beta',
          minWidth: 110,
          render: (value) => renderStringOrFloatAsDecimal({ value: value }),
        },
      ]}
      variantAnalysisGroupOptions={ibdAnalysisGroups}
      defaultVariantAnalysisGroup={ibdDefaultAnalysisGroup}
      defaultVariantTableSortKey="group_result.P_meta"
      defaultVariantTableSortOrder="ascending"
      variantResultColumns={[
        {
          key: 'group_result.P_meta',
          heading: 'P\u2011Value',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.BETA_meta',
          heading: 'Beta',
          minWidth: 65,
          render: (value) => renderStringOrFloatAsDecimal({ value: value }),
        },
      ]}
      variantConsequences={variantConsequences}
      renderVariantAttributes={({ cadd, revel, polyphen, splice_ai: spliceAi, sift }) => [
        { label: 'CADD', content: cadd === null ? '–' : cadd },
        { label: 'Revel', content: revel === null ? '–' : revel },
        { label: 'PolyPhen', content: polyphen === null ? '–' : polyphen },
        { label: 'Splice AI', content: spliceAi === null ? '–' : spliceAi },
        { label: 'Sift', content: sift === null ? '–' : sift },
      ]}
      additionalVariantDetailSummaryColumns={[
        {
          key: 'group_result.HetP',
          heading: 'Het P\u2011Value',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
      ]}
      variantDetailColumns={[
        {
          key: 'group_result.P_Twist',
          heading: 'P (Twist)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.BETA_Twist',
          heading: 'Beta (Twist)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdBetaValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.P_Nextera',
          heading: 'P (Nextera)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.BETA_Nextera',
          heading: 'Beta (Nextera)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdBetaValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.P_Sanger_WES',
          heading: 'P (Sanger WES)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.BETA_Sanger_WES',
          heading: 'Beta (Sanger WES)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdBetaValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.P_UKBB',
          heading: 'P (UKBB)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.BETA_UKBB',
          heading: 'Beta (UKBB)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdBetaValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.P_Sanger_WGS',
          heading: 'P (Sanger WGS)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.BETA_Sanger_WGS',
          heading: 'Beta (Sanger WGS)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdBetaValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.P_regeneron',
          heading: 'P (Regeneron)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdPValueOfZeroPlaceholder }),
        },
        {
          key: 'group_result.BETA_regeneron',
          heading: 'Beta (Regeneron)',
          minWidth: 85,
          render: (value) => renderStringOrFloatPvalueAsScientific({ value: value, zeroValue: ibdBetaValueOfZeroPlaceholder }),
        },
      ]}
      renderVariantTranscriptConsequences
    />
  )
}

export default IBDBrowser
