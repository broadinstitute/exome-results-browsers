import React from 'react'

// @ts-expect-error: no types in this @gnomad/ui version
import { ExternalLink, Link as StyledLink, Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from './DocumentTitle'

type ErrorBoundaryProps = {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    const { children } = this.props
    const { hasError } = this.state

    if (hasError) {
      const issueURL = `https://github.com/broadinstitute/exome-results-browsers/issues/new?title=${encodeURIComponent(
        `Render error on ${window.location.href}`
      )}`

      return (
        <Page>
          <DocumentTitle title="Error" />
          <PageHeading>Something Went Wrong</PageHeading>
          <p>An error occurred while rendering this page.</p>
          <p>
            This is a bug. Please{' '}
            <ExternalLink href={issueURL}>file an issue on GitHub</ExternalLink> and{' '}
            <StyledLink href="/">reload the browser</StyledLink>.
          </p>
        </Page>
      )
    }

    return children
  }
}

export default ErrorBoundary
