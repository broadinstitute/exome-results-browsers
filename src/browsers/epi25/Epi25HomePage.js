import React from 'react'
import styled from 'styled-components'

import { ExternalLink, Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from '../base/DocumentTitle'
import Link from '../base/Link'
import Searchbox from '../base/Searchbox'

const HomePageHeading = styled(PageHeading)`
  margin: 3em 0 1em;
`

const HomePageWrapper = styled(Page)`
  max-width: 740px;
  font-size: 16px;

  p {
    margin: 0 0 1.5em;
    line-height: 1.5;
  }
`

const Epi25HomePage = () => (
  <HomePageWrapper>
    <DocumentTitle title="Epi25 WES Browser" />
    <HomePageHeading>
      Epi25: a whole-exome sequencing case-control study of epilepsy
    </HomePageHeading>

    <Searchbox width="100%" />
    <p style={{ marginTop: '0.25em' }}>
      Or <Link to="/results">view all results</Link>
    </p>

    <p>
      The <ExternalLink href="https://epi-25.org">Epi25 collaborative</ExternalLink> is a global
      collaboration committed to aggregating, sequencing, and deep-phenotyping up to 25,000 epilepsy
      patients to advance epilepsy genetics research. Partnering with the Broad Institute, Epi25 has
      sequenced more than 20,000 patients as of 2022 from 59 research cohorts across the world.
    </p>

    <p>
      The Epi25 whole-exome sequencing (WES) case-control study is one of the collaborative&apos;s
      ongoing endeavors that aims to characterize the contribution of rare genetic variation to a
      spectrum of epilepsy syndromes to identify individual risk genes. The browser displays the
      latest findings from the study—as part of the consortium&apos;s deep dedication to data and
      resource sharing—with the hope of engaging the scientific community to generate hypotheses and
      facilitate discoveries.
    </p>

    <p>
      In the current release, we report gene burden results of ultra-rare deleterious variants
      (protein-truncating and damaging missense variants) in three primary epilepsy types:
      developmental and epileptic encephalopathy (DEE, N=1,938), genetic generalized epilepsy (GGE,
      N=5,499), non-acquired focal epilepsy (NAFE, N=9,219), as well as the full epilepsy cohort
      (EPI, N=20,979). Each subgroup was compared against 33,444 controls aggregated from
      independent sources. With the enlarged sample size, we discovered exome-wide significant genes
      for different types of epilepsies, implicating both shared and distinct rare variant risk
      factors. Integrating these findings with associations implicated by copy number variants
      (CNVs) and genome-wide association study (GWAS), we further identified convergence of
      different types of genetic risk factor in the same genes. Details of the WES analyses as well
      as the variant-calling and QC pipelines can be found in our latest preprint on bioRxiv. With
      the continuing effort to recruit samples, many from non-European populations, we anticipate a
      boost in the detection power to identify risk-conferring genes in the coming years.
    </p>

    <p>
      This work is supported and maintained by a tremendous effort worldwide, including the Epi25
      principal investigators, NHGRI (CCDG), and the Stanley Center at the Broad Institute. We are
      especially grateful to all the{' '}
      <ExternalLink href="https://epi-25.org/epi25-members/">consortium members</ExternalLink> and
      patients for their gracious contribution to make this collaboration possible. We welcome any
      feedback! You can contact us by{' '}
      <ExternalLink href="mailto:yfeng@broadinstitute.org">email</ExternalLink> if you have any
      questions or suggestions.
    </p>

    <p>
      All gene-level and variant-level results are{' '}
      <Link to="/downloads">available for download</Link>.
    </p>

    <p>Analysis data last updated January 23, 2023.</p>
  </HomePageWrapper>
)

export default Epi25HomePage
