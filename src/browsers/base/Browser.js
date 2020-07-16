import PropTypes from 'prop-types'
import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import DefaultHomePage from './DefaultHomePage'
import ErrorBoundary from './ErrorBoundary'
import GenePage from './GenePage/GenePage'
import GeneResultsPage from './GeneResultsPage/GeneResultsPage'
import InfoPage from './InfoPage'
import OtherStudies from './OtherStudies'
import PageNotFoundPage from './PageNotFoundPage'
import TopBar from './TopBar'
import vepConsequences from './vepConsequences'

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
  variantConsequences,
  variantCustomFilter,
  renderVariantAttributes,
}) => (
  <Router>
    <TopBar
      title={browserTitle}
      links={extraPages.map(({ path, label }) => ({ path, label }))}
      backgroundColor={navBarBackgroundColor}
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
        <Route path="/" exact component={homePage} />

        <Route
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

        <Route
          path="/gene/:gene"
          render={({ match }) => (
            <GenePage
              geneIdOrSymbol={match.params.gene}
              browserTitle={browserTitle}
              defaultVariantAnalysisGroup={defaultVariantAnalysisGroup}
              variantAnalysisGroupOptions={variantAnalysisGroupOptions}
              variantAnalysisGroupLabels={variantAnalysisGroupLabels}
              variantResultColumns={variantResultColumns}
              variantConsequences={variantConsequences}
              variantCustomFilter={variantCustomFilter}
              renderVariantAttributes={renderVariantAttributes}
            />
          )}
        />

        {extraPages.map(({ path, component }) => (
          <Route key={path} path={path} component={component} />
        ))}

        <Route
          path="/other-studies"
          render={() => (
            <InfoPage title="Other Studies">
              <OtherStudies />
            </InfoPage>
          )}
        />

        <Route component={PageNotFoundPage} />
      </Switch>
    </ErrorBoundary>
  </Router>
)

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
  variantConsequences: PropTypes.arrayOf(
    PropTypes.shape({
      term: PropTypes.string.isRequired,
      category: PropTypes.oneOf(['lof', 'missense', 'synonymous', 'other']).isRequired,
    })
  ),
  variantCustomFilter: PropTypes.shape({
    component: PropTypes.func.isRequired,
    defaultFilter: PropTypes.any.isRequired,
    applyFilter: PropTypes.func.isRequired,
  }),
  renderVariantAttributes: PropTypes.func,
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
  variantConsequences: vepConsequences,
  variantCustomFilter: undefined,
  renderVariantAttributes: undefined,
}

export default Browser
