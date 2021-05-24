import PropTypes from 'prop-types'
import React, { Component } from 'react'
import styled from 'styled-components'

import { Combobox, Page as BasePage, PageHeading, SearchInput, Tabs } from '@gnomad/ui'

import datasetConfig from '../../datasetConfig'
import DocumentTitle from '../DocumentTitle'
import CSVExportButton from '../CSVExportButton'
import Fetch from '../Fetch'
import StatusMessage from '../StatusMessage'
import GeneResultsTable from './GeneResultsTable'
import getTableColumns from './geneResultTableColumns'

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

class GeneResultsPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      searchText: '',
      selectedAnalysisGroup: props.defaultAnalysisGroup,
    }

    this.tableColumns = getTableColumns(props.geneResultColumns)
  }

  render() {
    const {
      browserTitle,
      analysisGroupOptions,
      defaultSortKey,
      pageHeading,
      geneResults,
      tabs,
    } = this.props

    const { selectedAnalysisGroup, searchText } = this.state

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
                    onSelect={(option) => {
                      this.setState({ selectedAnalysisGroup: option.id })
                    }}
                  />
                </AnalysisGroupMenuWrapper>
              )}

              <CSVExportButton
                data={results}
                columns={this.tableColumns}
                filename={`${selectedAnalysisGroup}_results`}
              >
                Export results to CSV
              </CSVExportButton>
            </div>

            <SearchInput
              placeholder="Search results by gene"
              onChange={(value) => {
                this.setState({ searchText: value.toUpperCase() })
              }}
            />
          </ControlSection>
          {tabs && tabs.length > 0 ? (
            <Tabs
              tabs={[
                {
                  id: 'table',
                  label: 'Table',
                  render: () => (
                    <GeneResultsTable
                      defaultSortKey={defaultSortKey}
                      geneResultColumns={this.tableColumns}
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
            />
          ) : (
            <GeneResultsTable
              defaultSortKey={defaultSortKey}
              geneResultColumns={this.tableColumns}
              geneResults={results}
              highlightText={searchText}
            />
          )}
        </div>
      </Page>
    )
  }
}

GeneResultsPage.propTypes = {
  browserTitle: PropTypes.string.isRequired,
  analysisGroupOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  defaultAnalysisGroup: PropTypes.string.isRequired,
  defaultSortKey: PropTypes.string,
  geneResultColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      render: PropTypes.func,
    })
  ).isRequired,
  geneResults: PropTypes.arrayOf(
    PropTypes.shape({
      gene_id: PropTypes.string.isRequired,
      gene_symbol: PropTypes.string.isRequired,
      gene_name: PropTypes.string,
    })
  ).isRequired,
  pageHeading: PropTypes.string,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func.isRequired,
    })
  ),
}

GeneResultsPage.defaultProps = {
  defaultSortKey: undefined,
  pageHeading: 'Results',
  tabs: [],
}

const GeneResultsPageContainer = ({
  analysisGroupOptions,
  defaultAnalysisGroup,
  ...otherProps
}) => {
  return (
    <Fetch path="/results">
      {({ data, error, loading }) => {
        if (loading) {
          return <StatusMessage>Loading results...</StatusMessage>
        }

        if (error || !(data || {}).results) {
          return <StatusMessage>Unable to load results</StatusMessage>
        }

        const results = data.results.map((resultValues) => {
          const result = {
            gene_id: resultValues[0],
            gene_symbol: resultValues[1],
            gene_name: resultValues[2],
            chrom: resultValues[3],
            pos: resultValues[4],
            group_results: {},
          }

          datasetConfig.gene_result_analysis_groups.forEach((group, groupIndex) => {
            const groupResult = {}
            const groupResultValues = resultValues[5][groupIndex]
            datasetConfig.gene_group_result_field_names.forEach(
              (groupResultField, groupResultFieldIndex) => {
                groupResult[groupResultField] = groupResultValues[groupResultFieldIndex]
              }
            )

            result.group_results[group] = groupResult
          })

          return result
        })

        return (
          <GeneResultsPage
            {...otherProps}
            analysisGroupOptions={analysisGroupOptions || datasetConfig.gene_result_analysis_groups}
            defaultAnalysisGroup={
              defaultAnalysisGroup || datasetConfig.gene_result_analysis_groups[0]
            }
            geneResults={results}
          />
        )
      }}
    </Fetch>
  )
}

GeneResultsPageContainer.propTypes = {
  analysisGroupOptions: PropTypes.arrayOf(PropTypes.string),
  defaultAnalysisGroup: PropTypes.string,
}

GeneResultsPageContainer.defaultProps = {
  analysisGroupOptions: undefined,
  defaultAnalysisGroup: undefined,
}

export default GeneResultsPageContainer
