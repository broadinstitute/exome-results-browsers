import React from 'react'

import Browser from '../base/Browser'
import { renderCount } from '../base/tableCells'

import ASCHomePage from './ASCHomePage'
import ASCVariantFilter from './ASCVariantFilter'

const ASCBrowser = () => (
  <Browser
    browserTitle="Autism Sequencing Consortium exome analysis"
    navBarBackgroundColor="#23509c"
    homePage={ASCHomePage}
    geneResultsPageHeading="Results"
    geneResultAnalysisGroupOptions={['All']}
    defaultGeneResultAnalysisGroup="All"
    defaultGeneResultSortKey="qval"
    geneResultColumns={[
      {
        key: 'xcase_dn_ptv',
        heading: 'De\u00a0novo PTV Cases',
        tooltip: 'De\u00a0novo protein-truncating variants cases',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcont_dn_ptv',
        heading: 'De\u00a0novo PTV Controls',
        tooltip: 'De\u00a0novo protein-truncating variants controls',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcase_dn_misa',
        heading: 'De\u00a0novo MisA Cases',
        tooltip: 'De\u00a0novo missense variants with MPC 1-2 cases',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcont_dn_misa',
        heading: 'De\u00a0novo MisA Controls',
        tooltip: 'De\u00a0novo missense variants with MPC 1-2 controls',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcase_dn_misb',
        heading: 'De\u00a0novo MisB Cases',
        tooltip: 'De\u00a0novo missense variants with MPC \u2265 2 cases',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcont_dn_misb',
        heading: 'De\u00a0novo MisB Controls',
        tooltip: 'De\u00a0novo missense variants with MPC \u2265 2 controls',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcase_dbs_ptv',
        heading: 'DBS PTV Cases',
        tooltip: 'Protein-truncating variants in iPSYCH ("Danish blood spot") cohort cases',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcont_dbs_ptv',
        heading: 'DBS PTV controls',
        tooltip: 'Protein-truncating variants in iPSYCH ("Danish blood spot") cohort controls',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcase_swe_ptv',
        heading: 'SWE PTV Cases',
        tooltip: 'Protein-truncating variants in Swedish cohort cases',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcont_swe_ptv',
        heading: 'SWE PTV Controls',
        tooltip: 'Protein-truncating variants in Swedish cohort controls',
        minWidth: 70,
        render: renderCount,
      },
      {
        key: 'xcase_tut',
        heading: 'Transmitted',
        tooltip: 'Protein-truncating variants transmitted to probands',
        minWidth: 100,
        render: renderCount,
      },
      {
        key: 'xcont_tut',
        heading: 'Untransmitted',
        tooltip: 'Protein-truncating variants not transmitted to probands',
        minWidth: 115,
        render: renderCount,
      },
      {
        key: 'qval',
        heading: 'Q\u2011Val',
        minWidth: 100,
      },
    ]}
    defaultVariantAnalysisGroup="ASC_DN"
    variantAnalysisGroupOptions={['ASC_DN', 'SWE', 'DBS']}
    variantAnalysisGroupLabels={{
      ASC_DN: 'De novo variants',
      SWE: 'Swedish cohort',
      DBS: 'iPSYCH ("Danish blood spot") cohort',
    }}
    variantResultColumns={[
      {
        key: 'group_result.in_analysis',
        heading: 'In Analysis',
        minWidth: 85,
        render: (value) => (value ? 'yes' : ''),
        renderForCSV: (value) => (value ? 'yes' : ''),
        showOnDetails: false,
      },
    ]}
    variantCustomFilter={{
      component: ASCVariantFilter,
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
    renderVariantAttributes={({ mpc, polyphen }) => [
      { label: 'PolyPhen', content: polyphen === null ? '–' : polyphen },
      { label: 'MPC', content: mpc === null ? '–' : mpc },
    ]}
  />
)

export default ASCBrowser
