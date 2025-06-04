import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
import { Redirect, BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import DefaultHomePage from './DefaultHomePage'
import DownloadsPage from './DownloadsPage'
import ErrorBoundary from './ErrorBoundary'
import GenePage from './GenePage/GenePage'
import GeneResultsPage from './GeneResultsPage/GeneResultsPage'
import InfoPage from './InfoPage'
import OtherStudies from './OtherStudies'
import PageNotFoundPage from './PageNotFoundPage'
import TopBar from './TopBar'
import vepConsequences from './vepConsequences'
import LoginPage from './LoginPage'
import { userHasBearerCookie } from './auth'

const PASSWORD_PROTECTED_DATASETS = ['IBD', 'GP2']

const ProtectedRoute = ({
  component: Component,
  render: renderFunc,
  isAuthenticated,
  datasetId,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      render={(props) => {
        if (PASSWORD_PROTECTED_DATASETS.includes(datasetId) && !isAuthenticated) {
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location },
              }}
            />
          )
        }

        if (Component) {
          return <Component {...props} />
        }

        if (renderFunc) {
          return renderFunc(props)
        }

        return null
      }}
    />
  )
}

ProtectedRoute.propTypes = {
  component: PropTypes.func,
  render: PropTypes.func,
  isAuthenticated: PropTypes.bool.isRequired,
  datasetId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  location: PropTypes.object,
}

ProtectedRoute.defaultProps = {
  component: undefined,
  render: undefined,
  location: {},
}

const Browser = ({
  browserTitle,
  navBarBackgroundColor,
  // Pages
  homePage,
  extraPages,
  // Gene results
  geneResultsPageHeading,
  geneResultAnalysisGroupOptions,
  defaultGeneResultAnalysisGroup,
  defaultGeneResultSortKey,
  geneResultColumns,
  geneResultTabs,
  // Variant results
  defaultVariantAnalysisGroup,
  variantAnalysisGroupOptions,
  variantAnalysisGroupLabels,
  variantResultColumns,
  defaultVariantTableSortKey,
  defaultVariantTableSortOrder,
  variantConsequences,
  variantConsequenceCategoryLabels,
  variantCustomFilter,
  renderVariantAttributes,
  additionalVariantDetailSummaryColumns,
  variantDetailColumns,
  renderVariantTranscriptConsequences,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const { datasetId } = window.datasetConfig

  useEffect(() => {
    setIsAuthenticated(userHasBearerCookie())
    setIsAuthLoading(false)
  }, [])

  if (isAuthLoading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <TopBar
        title={browserTitle}
        links={extraPages.map(({ path, label }) => ({ path, label }))}
        backgroundColor={navBarBackgroundColor}
        passwordProtectedDatasets={PASSWORD_PROTECTED_DATASETS}
      />

      {window.gtag && (
        <Route
          path="/"
          render={({ location }) => {
            window.gtag('config', window.gaTrackingId, {
              anonymize_ip: true,
              page_path: location.pathname,
            })
            return null
          }}
        />
      )}

      <ErrorBoundary>
        <Switch>
          <Route path="/login" exact component={LoginPage} />

          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            datasetId={datasetId}
            path="/"
            exact
            component={homePage}
          />

          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            datasetId={datasetId}
            path="/results"
            render={() => (
              <GeneResultsPage
                browserTitle={browserTitle}
                analysisGroupOptions={geneResultAnalysisGroupOptions}
                defaultAnalysisGroup={defaultGeneResultAnalysisGroup}
                defaultSortKey={defaultGeneResultSortKey}
                geneResultColumns={geneResultColumns}
                pageHeading={geneResultsPageHeading}
                tabs={geneResultTabs}
              />
            )}
          />

          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            datasetId={datasetId}
            path="/gene/:gene"
            render={({ match }) => (
              <GenePage
                geneIdOrSymbol={match.params.gene}
                browserTitle={browserTitle}
                defaultVariantAnalysisGroup={defaultVariantAnalysisGroup}
                variantAnalysisGroupOptions={variantAnalysisGroupOptions}
                variantAnalysisGroupLabels={variantAnalysisGroupLabels}
                variantResultColumns={variantResultColumns}
                variantSortKey={defaultVariantTableSortKey}
                variantSortOrder={defaultVariantTableSortOrder}
                variantConsequences={variantConsequences}
                variantConsequenceCategoryLabels={variantConsequenceCategoryLabels}
                variantCustomFilter={variantCustomFilter}
                renderVariantAttributes={renderVariantAttributes}
                additionalVariantDetailSummaryColumns={additionalVariantDetailSummaryColumns}
                variantDetailColumns={variantDetailColumns}
                renderVariantTranscriptConsequences={renderVariantTranscriptConsequences}
              />
            )}
          />

          {extraPages.map(({ path, component }) => (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              datasetId={datasetId}
              key={path}
              path={path}
              component={component}
            />
          ))}

          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            datasetId={datasetId}
            path="/downloads"
            component={DownloadsPage}
          />

          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            datasetId={datasetId}
            path="/other-studies"
            render={() => (
              <InfoPage title="Other Studies">
                <OtherStudies />
              </InfoPage>
            )}
          />

          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            datasetId={datasetId}
            component={PageNotFoundPage}
          />
        </Switch>
      </ErrorBoundary>
    </Router>
  )
}

Browser.propTypes = {
  browserTitle: PropTypes.string,
  navBarBackgroundColor: PropTypes.string,
  // Pages
  homePage: PropTypes.func,
  extraPages: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      component: PropTypes.func.isRequired,
    })
  ),
  // Gene results
  geneResultsPageHeading: PropTypes.string,
  geneResultAnalysisGroupOptions: PropTypes.arrayOf(PropTypes.string),
  defaultGeneResultAnalysisGroup: PropTypes.string,
  defaultGeneResultSortKey: PropTypes.string,
  geneResultColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      heading: PropTypes.string,
      minWidth: PropTypes.number,
      tooltip: PropTypes.string,
      render: PropTypes.func,
      renderForCSV: PropTypes.func,
    })
  ),
  geneResultTabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func.isRequired,
    })
  ),
  // Variant results
  variantAnalysisGroupOptions: PropTypes.arrayOf(PropTypes.string),
  defaultVariantAnalysisGroup: PropTypes.string,
  variantAnalysisGroupLabels: PropTypes.objectOf(PropTypes.string),
  variantResultColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      heading: PropTypes.string,
      minWidth: PropTypes.number,
      tooltip: PropTypes.string,
      render: PropTypes.func,
      renderForCSV: PropTypes.func,
      showOnGenePage: PropTypes.bool,
      showOnDetails: PropTypes.bool,
    })
  ),
  defaultVariantTableSortKey: PropTypes.string,
  defaultVariantTableSortOrder: PropTypes.string,
  variantConsequences: PropTypes.arrayOf(
    PropTypes.shape({
      term: PropTypes.string.isRequired,
      category: PropTypes.oneOf(['lof', 'missense', 'synonymous', 'other']).isRequired,
    })
  ),
  variantConsequenceCategoryLabels: PropTypes.shape({
    lof: PropTypes.string.isRequired,
    missense: PropTypes.string.isRequired,
    synonymous: PropTypes.string.isRequired,
    other: PropTypes.string.isRequired,
  }),
  variantCustomFilter: PropTypes.shape({
    component: PropTypes.func.isRequired,
    defaultFilter: PropTypes.any.isRequired,
    applyFilter: PropTypes.func.isRequired,
  }),
  variantDetailColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      heading: PropTypes.string,
      minWidth: PropTypes.number,
      tooltip: PropTypes.string,
      render: PropTypes.func,
      renderForCSV: PropTypes.func,
      showOnGenePage: PropTypes.bool,
      showOnDetails: PropTypes.bool,
    })
  ),
  renderVariantAttributes: PropTypes.func,
  additionalVariantDetailSummaryColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      heading: PropTypes.string,
      minWidth: PropTypes.number,
      tooltip: PropTypes.string,
      render: PropTypes.func,
      renderForCSV: PropTypes.func,
      showOnGenePage: PropTypes.bool,
      showOnDetails: PropTypes.bool,
    })
  ),
  renderVariantTranscriptConsequences: PropTypes.bool,
}

Browser.defaultProps = {
  browserTitle: 'Results Browser',
  navBarBackgroundColor: '#000',
  // Pages
  homePage: DefaultHomePage,
  extraPages: [],
  // Gene results
  geneResultsPageHeading: 'Results',
  geneResultAnalysisGroupOptions: undefined,
  defaultGeneResultAnalysisGroup: undefined,
  defaultGeneResultSortKey: 'gene_symbol',
  geneResultColumns: [],
  geneResultTabs: [],
  // Variant results
  variantAnalysisGroupOptions: undefined,
  defaultVariantAnalysisGroup: undefined,
  variantAnalysisGroupLabels: undefined,
  variantResultColumns: [],
  defaultVariantTableSortKey: undefined,
  defaultVariantTableSortOrder: undefined,
  variantConsequences: vepConsequences,
  variantConsequenceCategoryLabels: {
    lof: 'LoF',
    missense: 'Missense',
    synonymous: 'Synonymous',
    other: 'Other',
  },
  variantCustomFilter: undefined,
  variantDetailColumns: undefined,
  renderVariantAttributes: undefined,
  additionalVariantDetailSummaryColumns: undefined,
  renderVariantTranscriptConsequences: false,
}

export default Browser
