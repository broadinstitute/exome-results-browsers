import React from 'react'

import { ExternalLink, TooltipAnchor, TooltipHint } from '@gnomad/ui'

import Browser from '../base/Browser'
import { renderCount } from '../base/tableCells'

import GP2AboutPage from './GP2AboutPage'
import GP2HomePage from './GP2HomePage'
import GP2TermsPage from './GP2TermsPage'

import vepConsequences from '../base/vepConsequences'
import { renderExponentialIfSmall } from '../base/GenePage/variantTableColumns'

const variantConsequences = [...vepConsequences]

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

const GP2Browser = () => {
  // FIXME: these analysis groups are relevant to the temp
  //   Epi25 data we're using to populate the sparce
  //   demo browser with only GP2 variant results
  // This should be updated when we get Gene results
  const analysisGroups = [
    'EUR',
    'AAC',
    'CAH',
    'MDE',
    'AMR',
    'CAS',
    'EAS',
    'SAS',
    'AJ',
    'FIN',
    'AFR',
  ]

  const analysisGroupLabels = {
    AFR: 'African/African American',
    AAC: 'African',
    AJ: 'Ashkenazi Jewish',
    AMR: 'Latino and Indigenous people of the Americas',
    EAS: 'East Asian',
    EUR: 'European (non-Finnish)',
    SAS: 'South Asian',
    CAS: 'Central Asian',
    MDE: 'Middle Eastern',
    FIN: 'European (Finnish)',
    CAH: 'Complex Admixture',
  }

  const geneResultColumns = [
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
  ]

  return (
    <Browser
      browserTitle="GP2 Browser"
      navBarBackgroundColor="#207163"
      homePage={GP2HomePage}
      extraPages={[
        {
          path: '/about',
          label: 'About',
          component: GP2AboutPage,
        },
        {
          path: '/terms',
          label: 'Terms',
          component: GP2TermsPage,
        },
      ]}
      geneResultsPageHeading="GP2: gene burden results"
      geneResultsAnalysisGroupOptions={analysisGroups}
      defaultGeneResultAnalysisGroup="EUR"
      defaultGeneResultSortKey="ptv_pval"
      geneResultColumns={geneResultColumns}
      variantAnalysisGroupOptions={analysisGroups}
      defaultVariantAnalysisGroup="EUR"
      variantAnalysisGroupLabels={analysisGroupLabels}
      variantResultColumns={[
        {
          key: 'group_result.ces_ac_case',
          heading: 'CES AC Case',
          tooltip: 'Allele count in cases in clinical exome sequencing',
          isSortable: true,
          sortFunction: (a, b) => a - b,
          sortKey: 'group_result.ces_ac_case',
          minWidth: 75,
          render: (value) => value,
        },
        {
          key: 'group_result.ces_an_case',
          heading: 'CES AN Case',
          tooltip: 'Allele number in cases in clinical exome sequencing',
          isSortable: true,
          sortFunction: (a, b) => a - b,
          sortKey: 'group_result.ces_an_case',
          minWidth: 75,
          render: (value) => value,
        },
        {
          key: 'group_result.ces_af_case',
          heading: 'CES AF Case',
          tooltip: 'Allele frequency in case in clinical exome sequencing',
          isSortable: true,
          sortFunction: (a, b) => a - b,
          sortKey: 'group_result.ces_af_ctrl',
          minWidth: 80,
          render: renderExponentialIfSmall,
        },
      ]}
      variantConsequences={variantConsequences}
      renderVariantAttributes={({ cadd, clinvar_variation_id: clinvarID, rsid }) => [
        { label: 'CADD', content: cadd === null ? '-' : cadd },
        {
          label: (
            <TooltipAnchor tooltip="ClinVar data last updated September 18, 2025">
              <TooltipHint>ClinVar ID</TooltipHint>
            </TooltipAnchor>
          ),
          content:
            clinvarID === null ? (
              '-'
            ) : (
              <ExternalLink href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinvarID}/`}>
                {clinvarID}
              </ExternalLink>
            ),
        },
        {
          label: (
            <TooltipAnchor tooltip="rsids from dbSNP version 154">
              <TooltipHint>dnSNP rsid</TooltipHint>
            </TooltipAnchor>
          ),
          content:
            rsid === null ? (
              '-'
            ) : (
              <ExternalLink href={`https://www.ncbi.nlm.nih.gov/snp/${rsid}/`}>{rsid}</ExternalLink>
            ),
        },
      ]}
    />
  )
}

export default GP2Browser
