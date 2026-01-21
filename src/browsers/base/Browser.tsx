import React, { useEffect, useState } from 'react'
import {
  RouteComponentProps,
  Redirect,
  BrowserRouter as Router,
  Route,
  Switch,
  RouteProps,
} from 'react-router-dom'

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
import { GeneRow } from './GeneResultsPage/geneResultTableColumns'

export type DatasetId = 'ASC' | 'BipEx' | 'Epi25' | 'GP2' | 'IBD' | 'SCHEMA' | 'SCHEMA2'

export type ReferenceGenome = 'GRCh37' | 'GRCh38'

interface DatasetFields {
  reference_genome: ReferenceGenome
  gene_result_analysis_groups: string[]
  gene_group_result_field_names: string[]
  gene_group_result_field_types: string[]
  variant_result_analysis_groups: string[]
  variant_group_result_field_names: string[]
  variant_group_result_field_types: string[]
  variant_info_field_names: string[]
  variant_info_field_types: string[]
}

declare global {
  interface Window {
    datasetConfig: {
      datasetId: DatasetId
      reference_genome: ReferenceGenome
      datasets: Record<DatasetId, DatasetFields>
      gene_result_analysis_groups: string[]
      gene_group_result_field_names: string[]
      gene_group_result_field_types: string[]
      variant_result_analysis_groups: string[]
      variant_fields: string[]
      variant_group_result_field_names: string[]
      variant_group_result_field_types: string[]
      variant_info_field_names: string[]
      variant_info_field_types: string[]
    }
    gaTrackingId: string
    gtag: Gtag.Gtag
  }
}

const PASSWORD_PROTECTED_DATASETS: DatasetId[] = ['IBD', 'BipEx', 'SCHEMA2']

interface ProtectedRouteExtraProps {
  datasetId: DatasetId
  isAuthenticated: boolean
}

interface ProtectedRouteProps extends Omit<RouteProps, 'component' | 'render'> {
  component?: React.ComponentType<RouteComponentProps<any> & ProtectedRouteExtraProps>
  render?: (props: RouteComponentProps<any> & ProtectedRouteExtraProps) => React.ReactNode
  isAuthenticated: boolean
  datasetId: DatasetId
}

const ProtectedRoute = ({
  component: Component = undefined,
  render: renderFunc = undefined,
  isAuthenticated,
  datasetId,
  ...rest
}: ProtectedRouteProps) => {
  return (
    <Route
      {...rest}
      render={(routeProps: RouteComponentProps) => {
        if (PASSWORD_PROTECTED_DATASETS.includes(datasetId) && !isAuthenticated) {
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: routeProps.location },
              }}
            />
          )
        }

        if (Component) {
          return (
            <Component
              {...routeProps}
              {...rest}
              datasetId={datasetId}
              isAuthenticated={isAuthenticated}
            />
          )
        }

        if (renderFunc) {
          return renderFunc({
            ...routeProps,
            ...rest,
            datasetId,
            isAuthenticated,
          })
        }

        return null
      }}
    />
  )
}

type ExtraPage = {
  path: string
  label: string
  component: React.ComponentType<any>
}

export type GeneResultColumnConfig = {
  key: string
  heading?: string
  minWidth?: number
  tooltip?: string
  render?: (record: any) => React.ReactNode
  renderForCSV?: (record: any) => string | number
}

export type GeneResultTabConfig = {
  id: string
  label: string
  render: (record: GeneRow[]) => React.ReactNode
}

export type VariantColumnConfig = {
  key: string
  heading?: string
  minWidth?: number
  tooltip?: string
  render?: (record: any) => React.ReactNode
  renderForCSV?: (record: any) => string | number
  showOnGenePage?: boolean
  showOnDetails?: boolean
}

export type ConsequenceCategory = 'lof' | 'missense' | 'synonymous' | 'other'

export interface VariantConsequence {
  term: string
  label?: string
  category: ConsequenceCategory
}

export type VariantConsequenceCategoryLabels = Record<ConsequenceCategory, string>

export type VariantCustomFilter = {
  component: React.ElementType
  defaultFilter: any
  applyFilter: (record: any) => void
}

type BrowserProps = {
  browserTitle?: string
  navBarBackgroundColor?: string
  homePage?: React.ComponentType<any>
  extraPages?: ExtraPage[]

  geneResultsPageHeading?: string
  geneResultAnalysisGroupOptions?: string[]
  defaultGeneResultAnalysisGroup?: string
  defaultGeneResultSortKey?: string
  geneResultColumns?: GeneResultColumnConfig[]
  geneResultTabs?: GeneResultTabConfig[]

  variantAnalysisGroupOptions: string[]
  defaultVariantAnalysisGroup: string
  variantAnalysisGroupLabels?: Record<string, string>
  variantResultColumns?: VariantColumnConfig[]
  defaultVariantTableSortKey?: string
  defaultVariantTableSortOrder?: string
  variantConsequences?: VariantConsequence[]
  variantConsequenceCategoryLabels?: VariantConsequenceCategoryLabels
  variantCustomFilter?: VariantCustomFilter
  variantDetailColumns?: VariantColumnConfig[]
  renderVariantAttributes?: (record: any) => void
  additionalVariantDetailSummaryColumns?: VariantColumnConfig[]
  renderVariantTranscriptConsequences?: boolean
}

const Browser = ({
  browserTitle = 'Results Browser',
  navBarBackgroundColor = '#000',
  // Pages
  homePage = DefaultHomePage,
  extraPages = [],
  // Gene results
  geneResultsPageHeading = 'Results',
  geneResultAnalysisGroupOptions = undefined,
  defaultGeneResultAnalysisGroup = undefined,
  defaultGeneResultSortKey = 'gene_symbol',
  geneResultColumns = [],
  geneResultTabs = [],
  // Variant results
  defaultVariantAnalysisGroup,
  variantAnalysisGroupOptions,
  variantAnalysisGroupLabels = undefined,
  variantResultColumns = [],
  defaultVariantTableSortKey = undefined,
  defaultVariantTableSortOrder = undefined,
  variantConsequences = vepConsequences,
  variantConsequenceCategoryLabels = {
    lof: 'LoF',
    missense: 'Missense',
    synonymous: 'Synonymous',
    other: 'Other',
  },
  variantCustomFilter = undefined,
  renderVariantAttributes = undefined,
  additionalVariantDetailSummaryColumns = undefined,
  variantDetailColumns = undefined,
  renderVariantTranscriptConsequences = false,
}: BrowserProps) => {
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

          {datasetId !== 'GP2' && (
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
          )}

          <ProtectedRoute
            isAuthenticated={isAuthenticated}
            datasetId={datasetId}
            path="/gene/:gene"
            render={({ match }) => (
              <GenePage
                datasetId={datasetId}
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

          {datasetId !== 'GP2' && (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              datasetId={datasetId}
              path="/downloads"
              component={DownloadsPage}
            />
          )}

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

export default Browser
