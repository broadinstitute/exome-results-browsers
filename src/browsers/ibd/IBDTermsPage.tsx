import React from 'react'

import InfoPage from '../base/InfoPage'
import StyledContent from '../base/StyledContent'

import termsPageContent from './content/terms.md'

const TermsPageContent = () => (
  <InfoPage title="Terms of Use">
    <StyledContent dangerouslySetInnerHTML={{ __html: termsPageContent.html }} />
  </InfoPage>
)

export default TermsPageContent
