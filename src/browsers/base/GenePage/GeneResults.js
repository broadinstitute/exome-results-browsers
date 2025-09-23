import PropTypes from 'prop-types'
import React from 'react'

import { Badge, ExternalLink, List, ListItem } from '@gnomad/ui'

import datasetConfig from '../../datasetConfig'
import geneResultComponents from '../../geneResultComponents'

const DatasetGeneResultComponent = geneResultComponents[datasetConfig.datasetId]

const studyPhenotypes = {
  ASC: 'Autism',
  BipEx: 'Bipolar disorder',
  Epi25: 'Epilepsy',
  SCHEMA: 'Schizophrenia',
  GP2: 'Parkinsons',
}

const GeneResults = DatasetGeneResultComponent
  ? ({ gene, results }) => {
      const { [datasetConfig.datasetId]: datasetResults, ...otherResults } = results

      const associatedOtherResults = Object.keys(otherResults)
        .map((dataset) => ({
          dataset,
          r: otherResults[dataset],
        }))
        .filter(({ dataset, r }) => {
          if (dataset === 'SCHEMA' && r.meta['P meta'] <= 7.9e-5) {
            return true
          }
          if (dataset === 'ASC' && r.All.qval <= 0.1) {
            return true
          }
          return false
        })

      return (
        <>
          <DatasetGeneResultComponent results={datasetResults || {}} />
          {associatedOtherResults.length > 0 && (
            <>
              <p>
                <Badge level="info">Note</Badge> Other studies have found this gene to be associated
                with:
              </p>
              <List>
                {associatedOtherResults.map(({ dataset }) => (
                  <ListItem key={dataset}>
                    {studyPhenotypes[dataset]} -{' '}
                    <ExternalLink
                      href={`https://${dataset.toLowerCase()}.broadinstitute.org/gene/${
                        gene.gene_id
                      }`}
                    >
                      see details in {dataset} browser
                    </ExternalLink>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </>
      )
    }
  : () => null

GeneResults.propTypes = {
  gene: PropTypes.shape({
    gene_id: PropTypes.string.isRequired,
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
