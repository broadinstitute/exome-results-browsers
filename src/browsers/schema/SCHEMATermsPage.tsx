import React from 'react'

import InfoPage from '../base/InfoPage'
import StyledContent from '../base/StyledContent'

import termsPageContent from './content/terms.md'

const TermsPage = () => (
  <InfoPage title={termsPageContent.title}>
    <StyledContent dangerouslySetInnerHTML={{ __html: termsPageContent.html }} />
  </InfoPage>
)

export default TermsPage
