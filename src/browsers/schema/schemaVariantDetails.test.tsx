import React from 'react'
import { render, screen } from '@testing-library/react'

import VariantDetails from '../base/GenePage/VariantDetails'
import { VariantRow } from '../base/GenePage/variantTableColumns'
import {
  renderSchemaVariantAttributes,
  schemaAnalysisGroups,
  schemaDefaultAnalysisGroup,
  schemaVariantResultColumns,
} from './SCHEMABrowser'
import { schemaVariantInfoFactory, schemaVariantRowFactory } from './schemaVariantTypes.factory'

describe('SCHEMA variant modal (VariantDetails)', () => {
  it('renders the SCHEMA-specific variant attributes from renderSchemaVariantAttributes', () => {
    const variant = schemaVariantRowFactory.build({
      info: schemaVariantInfoFactory.build({ mpc: 3.2 }),
    })

    render(
      <VariantDetails
        datasetId="SCHEMA"
        defaultVariantAnalysisGroup={schemaDefaultAnalysisGroup}
        referenceGenome="GRCh37"
        variant={(variant as unknown) as VariantRow}
        variantAnalysisGroupOptions={schemaAnalysisGroups}
        variantAnalysisGroupLabels={{}}
        variantResultColumns={schemaVariantResultColumns.filter((c) => c.showOnDetails !== false)}
        renderVariantAttributes={renderSchemaVariantAttributes}
        additionalVariantDetailSummaryColumns={undefined}
        variantDetailColumns={undefined}
        renderVariantTranscriptConsequences={false}
        filter={{
          includeCategories: { lof: true, missense: true, synonymous: true, other: true },
          searchText: '',
          custom: { onlyInAnalysis: false, onlyDeNovo: false },
        }}
      />
    )

    expect(screen.getByText('MPC:')).toBeInTheDocument()
    expect(screen.getByText('MPC:').parentElement?.textContent).toEqual('MPC:3.2')
  })
})
