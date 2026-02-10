import React, { useMemo, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { Combobox, Page as BasePage, PageHeading, SearchInput, Tabs } from '@gnomad/ui'

import datasetConfig from '../../datasetConfig'
import DocumentTitle from '../DocumentTitle'
import CSVExportButton from '../CSVExportButton'
import Fetch from '../Fetch'
import StatusMessage from '../StatusMessage'
import GeneResultsTable from './GeneResultsTable'
import getTableColumns, { GeneRow } from './geneResultTableColumns'
import { GeneResultColumnConfig, GeneResultTabConfig } from '../Browser'

const Page = styled(BasePage)`
  max-width: 1600px;
`

const ControlSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1em;
`

const AnalysisGroupMenuWrapper = styled.div`
  margin-bottom: 1em;
`

interface GeneResultsPageProps {
  browserTitle: string
  analysisGroupOptions: string[]
  defaultAnalysisGroup: string
  defaultSortKey?: string
  geneResultColumns: GeneResultColumnConfig[]
  pageHeading?: string
  geneResults: GeneRow[]
  tabs?: GeneResultTabConfig[]
}

const GeneResultsPage = ({
  browserTitle,
  analysisGroupOptions,
  defaultAnalysisGroup,
  defaultSortKey = undefined,
  geneResultColumns,
  pageHeading = 'Results',
  geneResults,
  tabs = [],
}: GeneResultsPageProps) => {
  const tableColumns = useMemo(() => getTableColumns(geneResultColumns), [geneResultColumns])
  const [searchText, setSearchText] = useState('')
  const [selectedAnalysisGroup, setSelectedAnalysisGroup] = useState(defaultAnalysisGroup)

  const location = useLocation()
  const selectedTabId =
    ['table', ...tabs.map((tab) => tab.id)].find((tabId) => tabId === location.hash.slice(1)) ||
    'table'

  const history = useHistory()

  const results = geneResults
    .filter(
      (result) =>
        (result.gene_id || '').includes(searchText) ||
        (result.gene_symbol || '').includes(searchText) ||
        (result.gene_name || '').toUpperCase().includes(searchText)
    )
    .map((result) => ({
      ...result,
      ...result.group_results[selectedAnalysisGroup],
    }))

  return (
    <Page>
      <DocumentTitle title={`Results | ${browserTitle}`} />
      <PageHeading>{pageHeading}</PageHeading>
      <div>
        <ControlSection>
          <div>
            {analysisGroupOptions.length > 1 && (
              <AnalysisGroupMenuWrapper>
                {/* eslint-disable-next-line jsx-a11y/label-has-for,jsx-a11y/label-has-associated-control */}
                <label htmlFor="analysis-group-menu">Current analysis group </label>
                <Combobox
                  id="analysis-group-menu"
                  options={analysisGroupOptions.map((group) => ({
                    id: group,
                    label: group,
                  }))}
                  value={selectedAnalysisGroup}
                  onSelect={(option: { id: string }) => {
                    setSelectedAnalysisGroup(option.id)
                  }}
                />
              </AnalysisGroupMenuWrapper>
            )}

            <CSVExportButton
              data={results}
              columns={tableColumns}
              filename={`${selectedAnalysisGroup}_results`}
            >
              Export results to CSV
            </CSVExportButton>
          </div>

          <SearchInput
            placeholder="Search results by gene"
            onChange={(value: string) => {
              setSearchText(value.toUpperCase())
            }}
          />
        </ControlSection>
        {tabs && tabs.length > 0 ? (
          <Tabs
            activeTabId={selectedTabId}
            tabs={[
              {
                id: 'table',
                label: 'Table',
                render: () => (
                  <GeneResultsTable
                    defaultSortKey={defaultSortKey}
                    geneResultColumns={tableColumns}
                    geneResults={results}
                    highlightText={searchText}
                  />
                ),
              },
              ...tabs.map(({ id, label, render }) => ({
                id,
                label,
                render: () => render(results),
              })),
            ]}
            onChange={(tabId: string) => {
              history.replace(
                `${location.pathname}${location.search}${tabId === 'table' ? '' : `#${tabId}`}`
              )
            }}
          />
        ) : (
          <GeneResultsTable
            defaultSortKey={defaultSortKey}
            geneResultColumns={tableColumns}
            geneResults={results}
            highlightText={searchText}
          />
        )}
      </div>
    </Page>
  )
}

interface GeneResultsPageContainerProps {
  browserTitle: string
  analysisGroupOptions?: string[]
  defaultAnalysisGroup?: string
  defaultSortKey: string
  geneResultColumns: GeneResultColumnConfig[]
  pageHeading: string
  tabs: GeneResultTabConfig[]
}

const GeneResultsPageContainer = ({
  browserTitle,
  analysisGroupOptions = undefined,
  defaultAnalysisGroup = undefined,
  defaultSortKey,
  geneResultColumns,
  pageHeading,
  tabs,
}: GeneResultsPageContainerProps) => {
  return (
    <Fetch path="/results">
      {({ data, error, loading }) => {
        if (loading) {
          return <StatusMessage>Loading results...</StatusMessage>
        }

        if (error || !(data || {}).results) {
          return <StatusMessage>Unable to load results</StatusMessage>
        }

        // TODO: better type either results on this fetch, or the resultValues
        const results = data.results.map((resultValues: any) => {
          const result: { [key: string]: any } = {
            gene_id: resultValues[0],
            gene_symbol: resultValues[1],
            gene_name: resultValues[2],
            chrom: resultValues[3],
            pos: resultValues[4],
            group_results: {},
          }

          datasetConfig.gene_result_analysis_groups.forEach((group: string, groupIndex: number) => {
            const groupResult: { [key: string]: any } = {}
            const groupResultValues = resultValues[5][groupIndex]
            datasetConfig.gene_group_result_field_names.forEach(
              (groupResultField: string, groupResultFieldIndex: number) => {
                groupResult[groupResultField] = groupResultValues[groupResultFieldIndex]
              }
            )

            result.group_results[group] = groupResult
          })

          return result
        })

        return (
          <GeneResultsPage
            browserTitle={browserTitle}
            analysisGroupOptions={analysisGroupOptions || datasetConfig.gene_result_analysis_groups}
            defaultAnalysisGroup={
              defaultAnalysisGroup || datasetConfig.gene_result_analysis_groups[0]
            }
            defaultSortKey={defaultSortKey}
            geneResultColumns={geneResultColumns}
            pageHeading={pageHeading}
            tabs={tabs}
            geneResults={results}
          />
        )
      }}
    </Fetch>
  )
}

export default GeneResultsPageContainer
