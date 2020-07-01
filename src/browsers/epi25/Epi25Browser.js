import React from 'react'

import Browser from '../base/Browser'
import GeneResultsManhattanPlot from '../base/GeneResultsPage/GeneResultsManhattanPlot'
import { renderCount } from '../base/tableCells'

import Epi25HomePage from './Epi25HomePage'
import Epi25TermsPage from './Epi25TermsPage'
import Epi25VariantFilter from './Epi25VariantFilter'

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
    defaultGeneResultSortKey="pval"
    geneResultColumns={[
      {
        key: 'xcase_lof',
        heading: 'Case LoF',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xctrl_lof',
        heading: 'Control LoF',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'pval_lof',
        heading: 'P\u2011Val LoF',
        minWidth: 90,
      },
      {
        key: 'xcase_mpc',
        heading: 'Case MPC',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xctrl_mpc',
        heading: 'Control MPC',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'pval_mpc',
        heading: 'P\u2011Val MPC',
        minWidth: 90,
      },
      {
        key: 'xcase_infrIndel',
        heading: 'Case Inframe Indel',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xctrl_infrIndel',
        heading: 'Control Inframe Indel',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'pval_infrIndel',
        heading: 'P\u2011Val Inframe Indel',
        minWidth: 90,
      },
      {
        key: 'pval',
        heading: 'P\u2011Val',
        minWidth: 90,
      },
    ]}
    geneResultTabs={[
      {
        label: 'Manhattan Plot',
        render: (results) => (
          <GeneResultsManhattanPlot
            results={results}
            thresholds={[
              {
                label: 'Exome-wide significance (p = 6.8e-7)',
                value: 6.8e-7,
              },
            ]}
          />
        ),
      },
    ]}
    defaultVariantAnalysisGroup="EPI"
    variantAnalysisGroupOptions={['EPI', 'DEE', 'GGE', 'NAFE']}
    variantResultColumns={[
      {
        key: 'group_result.Estimate',
        heading: 'Estimate',
        tooltip:
          'For variants with an overall AF>0.001, an association odds ratio, standard error, and p-value are estimated using Firth’s logistic regression correcting for sex and the first 10 principal components',
      },
      {
        key: 'group_result.SE',
        heading: 'SE',
        tooltip:
          'For variants with an overall AF>0.001, an association odds ratio, standard error, and p-value are estimated using Firth’s logistic regression correcting for sex and the first 10 principal components',
      },
      {
        key: 'group_result.P-value',
        heading: 'P-Val',
        tooltip:
          'For variants with an overall AF>0.001, an association odds ratio, standard error, and p-value are estimated using Firth’s logistic regression correcting for sex and the first 10 principal components',
      },
      {
        key: 'info.in_analysis',
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
        term: 'loss of function',
        category: 'lof',
      },
      {
        term: 'inframe indel',
        category: 'missense',
      },
      {
        term: 'missense',
        category: 'missense',
      },
      {
        term: 'other missense',
        category: 'missense',
      },
      {
        term: 'damaging missense',
        category: 'missense',
      },
      {
        term: 'damaging missense (MPC)',
        category: 'missense',
      },
      {
        term: 'synonymous',
        category: 'synonymous',
      },
      {
        term: 'splice_region',
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
          return variants.filter((v) => v.info.in_analysis)
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
