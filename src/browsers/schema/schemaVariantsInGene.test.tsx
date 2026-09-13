import React, { ComponentProps } from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { screen, within } from '@testing-library/react'
// @ts-expect-error: no types in this version of @gnomad/region-viewer
import { RegionViewer } from '@gnomad/region-viewer'

import { VariantsInGene } from '../base/GenePage/VariantsInGene'
import { defineVariantCategoryOptions } from '../base/variantCategories'
import {
  renderSchemaVariantAttributes,
  schemaAnalysisGroups,
  schemaDefaultAnalysisGroup,
  schemaVariantCustomFilter,
  schemaVariantResultColumns,
} from './SCHEMABrowser'

const schemaVariantCategoryOptions = defineVariantCategoryOptions({
  lof: { label: 'PTV', color: '#FF583F' },
  missense: { label: 'Missense', color: '#F0C94D' },
  synonymous: { label: 'Synonymous', color: '#008000' },
  other: { label: 'Other', color: '#757575' },
})
import {
  schemaVariantGroupResultFactory,
  schemaVariantRowFactory,
} from './schemaVariantTypes.factory'

type VariantsInGeneProps = ComponentProps<typeof VariantsInGene>

const renderVariantsInGene = (variants: ReturnType<typeof schemaVariantRowFactory.build>[]) => {
  const container = document.createElement('div')
  document.body.appendChild(container)

  act(() => {
    ReactDOM.render(
      <RegionViewer
        padding={75}
        regions={[{ feature_type: 'exon', start: 1, stop: 1000000 }]}
        width={800}
      >
        <VariantsInGene
          datasetId="SCHEMA"
          gene={{ gene_id: 'ENSG00000181090', reference_genome: 'GRCh37' }}
          variants={(variants as unknown) as VariantsInGeneProps['variants']}
          variantAnalysisGroupOptions={schemaAnalysisGroups}
          defaultVariantAnalysisGroup={schemaDefaultAnalysisGroup}
          variantAnalysisGroupLabels={{}}
          variantResultColumns={schemaVariantResultColumns}
          variantCategoryOptions={schemaVariantCategoryOptions}
          variantCustomFilter={
            (schemaVariantCustomFilter as unknown) as VariantsInGeneProps['variantCustomFilter']
          }
          renderVariantAttributes={renderSchemaVariantAttributes}
          additionalVariantDetailSummaryColumns={undefined}
          variantDetailColumns={undefined}
          renderVariantTranscriptConsequences={false}
        />
      </RegionViewer>,
      container
    )
  })
}

const buildVariant = (
  variantId: string,
  groupResultOverrides: Partial<ReturnType<typeof schemaVariantGroupResultFactory.build>>
) => {
  const groupResult = schemaVariantGroupResultFactory.build(groupResultOverrides)
  return schemaVariantRowFactory.build({
    variant_id: variantId,
    group_result: groupResult,
    group_results: { meta: groupResult },
  })
}

describe('SCHEMA variant table (VariantsInGene)', () => {
  it('renders a row for each fixture variant, with its de novo count and in-analysis status', () => {
    const deNovoVariant = buildVariant('16-30984070-G-A', { n_de_novo: 2, in_analysis: true })
    const nonDeNovoVariant = buildVariant('16-30984100-C-T', { n_de_novo: 0, in_analysis: false })

    renderVariantsInGene([deNovoVariant, nonDeNovoVariant])

    const deNovoRow = screen.getByText('16-30984070-G-A').closest('[role="row"]') as HTMLElement
    const nonDeNovoRow = screen.getByText('16-30984100-C-T').closest('[role="row"]') as HTMLElement

    expect(within(deNovoRow).getByText('2')).toBeInTheDocument()
    expect(within(deNovoRow).getByText('yes')).toBeInTheDocument()
    expect(within(nonDeNovoRow).getByText('0')).toBeInTheDocument()
    expect(within(nonDeNovoRow).queryByText('yes')).not.toBeInTheDocument()
  })
})
