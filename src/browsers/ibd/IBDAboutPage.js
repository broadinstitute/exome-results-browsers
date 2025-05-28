import React from 'react'

import InfoPage from '../base/InfoPage'
import StyledContent from '../base/StyledContent'

import aboutPageContent from './content/about.md'

const AboutPage = () => (
  <InfoPage title={aboutPageContent.title}>
    <StyledContent dangerouslySetInnerHTML={{ __html: aboutPageContent.html }} />
  </InfoPage>
)

export default AboutPage
