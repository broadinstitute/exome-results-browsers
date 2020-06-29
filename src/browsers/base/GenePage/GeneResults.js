import PropTypes from 'prop-types'
import React from 'react'

import datasetConfig from '../../datasetConfig'
import geneResultComponents from '../../geneResultComponents'

const DatasetGeneResultComponent = geneResultComponents[datasetConfig.datasetId]

const GeneResults = DatasetGeneResultComponent
  ? ({ results }) => {
      const { [datasetConfig.datasetId]: datasetResults } = results
      return <DatasetGeneResultComponent results={datasetResults || {}} />
    }
  : () => null

GeneResults.propTypes = {
  gene: PropTypes.shape({
    symbol: PropTypes.string,
  }).isRequired,
  results: PropTypes.objectOf(PropTypes.objectOf(PropTypes.any)).isRequired,
}

const GeneResultsContainer = ({ geneResults, ...otherProps }) => {
  const results = {}
  Object.keys(geneResults).forEach((dataset) => {
    if (geneResults[dataset]) {
      const datasetResults = {}
      datasetConfig.datasets[dataset].gene_result_analysis_groups.forEach((group, groupIndex) => {
        const groupResult = {}
        const groupResultValues = geneResults[dataset].group_results[groupIndex]
        datasetConfig.datasets[dataset].gene_group_result_field_names.forEach(
          (groupResultField, groupResultFieldIndex) => {
            groupResult[groupResultField] = groupResultValues[groupResultFieldIndex]
          }
        )

        datasetResults[group] = groupResult
      })

      results[dataset] = datasetResults
    }
  })

  return <GeneResults {...otherProps} results={results} />
}

GeneResultsContainer.propTypes = {
  geneResults: PropTypes.objectOf(
    PropTypes.shape({
      group_results: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any)).isRequired,
    })
  ).isRequired,
}

export default GeneResultsContainer
