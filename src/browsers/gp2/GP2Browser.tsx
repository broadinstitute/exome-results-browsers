import React from 'react'

import { ExternalLink, TooltipAnchor, TooltipHint } from '@gnomad/ui'

import Browser, { GeneResultColumnConfig } from '../base/Browser'
import {
  renderCount,
  renderOddsRatio,
  renderStringOrFloatPvalueAsScientific,
} from '../base/tableCells'

import GP2AboutPage from './GP2AboutPage'
import GP2HomePage from './GP2HomePage'
import GP2TermsPage from './GP2TermsPage'

import vepConsequences from '../base/vepConsequences'

const variantConsequences = [...vepConsequences]

export const gp2AnalysisGroups = [
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
] as const
export type GP2AnalysisGroup = typeof gp2AnalysisGroups[number]
export const gp2DefaultAnalysisGroup: GP2AnalysisGroup = 'EUR'

export const gp2AnalysisGroupLabels: Record<GP2AnalysisGroup, string> = {
  AFR: 'African',
  AAC: 'African Admixed',
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

export const gp2PValueOfZeroPlaceholder = '2.2e-16'

const GP2Browser = () => {
  const geneResultColumns: GeneResultColumnConfig[] = [
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
      render: (value) =>
        renderStringOrFloatPvalueAsScientific({
          value: value,
          zeroValue: gp2PValueOfZeroPlaceholder,
        }),
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
      render: (value) =>
        renderStringOrFloatPvalueAsScientific({
          value: value,
          zeroValue: gp2PValueOfZeroPlaceholder,
        }),
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
      geneResultAnalysisGroupOptions={gp2AnalysisGroups}
      defaultGeneResultAnalysisGroup={gp2DefaultAnalysisGroup}
      defaultGeneResultSortKey="ptv_pval"
      geneResultColumns={geneResultColumns}
      variantAnalysisGroupOptions={gp2AnalysisGroups}
      defaultVariantAnalysisGroup={gp2DefaultAnalysisGroup}
      variantAnalysisGroupLabels={gp2AnalysisGroupLabels}
      variantResultColumns={[]}
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
