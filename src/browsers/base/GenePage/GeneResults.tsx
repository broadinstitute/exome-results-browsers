import React from 'react'

// @ts-expect-error: no types in this version of @gnomad/ui
import { Badge, ExternalLink, List, ListItem } from '@gnomad/ui'

import datasetConfig from '../../datasetConfig'
import geneResultComponents from '../../geneResultComponents'
import {
  IndividualGeneAPIResponse,
  IndividualGeneGeneResultsAPIResponse,
} from '../GeneResultsPage/geneResultTableColumns'
import { DatasetId } from '../Browser'

const DatasetGeneResultComponent = geneResultComponents[datasetConfig.datasetId]

const studyPhenotypes: Partial<Record<DatasetId, string>> = {
  ASC: 'Autism',
  BipEx: 'Bipolar disorder',
  Epi25: 'Epilepsy',
  SCHEMA: 'Schizophrenia',
  SCHEMA2: 'Schizophrenia',
  GP2: 'Parkinsons',
}

interface GeneResultsProps {
  gene: IndividualGeneAPIResponse
  results: ParsedResults
}

const GeneResults = DatasetGeneResultComponent
  ? ({ gene, results }: GeneResultsProps) => {
      const { [datasetConfig.datasetId]: rawDatasetResults, ...rawOtherResults } = results

      const datasetResults = rawDatasetResults as ParsedDatasetResult | undefined
      const otherResults = rawOtherResults as Partial<Record<DatasetId, ParsedDatasetResult>>

      const associatedOtherResults = (Object.keys(otherResults) as DatasetId[])
        .map((dataset) => ({
          dataset,
          result: otherResults[dataset] as ParsedDatasetResult,
        }))
        .filter(({ dataset, result }) => {
          // TK: TODO: fixme: make proper types for all of the different studies parsed results
          //   you KNOW this from the pipeline. Can these be generated somehow?
          if (dataset === 'SCHEMA' && (result.meta as any)['P meta'] <= 7.9e-5) {
            return true
          }
          if (dataset === 'ASC' && (result.All as any).qval <= 0.1) {
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

interface GeneResultsContainerProps {
  gene: IndividualGeneAPIResponse
  geneResults: IndividualGeneGeneResultsAPIResponse
}

type ParsedGroupResult = Record<string, unknown>
type ParsedDatasetResult = Record<string, ParsedGroupResult>
type ParsedResults = Partial<Record<DatasetId, ParsedDatasetResult>>

const GeneResultsContainer = ({ gene, geneResults, ...otherProps }: GeneResultsContainerProps) => {
  const results: ParsedResults = {}

  const typedKeys = Object.keys(geneResults) as DatasetId[]

  typedKeys.forEach((dataset) => {
    const currentDatasetResult = geneResults[dataset]

    if (currentDatasetResult) {
      const datasetResults: ParsedDatasetResult = {}

      datasetConfig.datasets[dataset].gene_result_analysis_groups.forEach((group, groupIndex) => {
        const groupResult: ParsedGroupResult = {}
        const groupResultValues = currentDatasetResult.group_results[groupIndex]

        if (groupResultValues) {
          datasetConfig.datasets[dataset].gene_group_result_field_names.forEach(
            (groupResultField, groupResultFieldIndex) => {
              groupResult[groupResultField] = groupResultValues[groupResultFieldIndex]
            }
          )
        }

        datasetResults[group] = groupResult
      })

      results[dataset] = datasetResults
    }
  })

  return <GeneResults gene={gene} results={results} {...otherProps} />
}

export default GeneResultsContainer
