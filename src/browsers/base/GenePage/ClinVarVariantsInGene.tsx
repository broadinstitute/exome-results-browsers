
import React, { useContext, useState } from 'react'
import styled from 'styled-components'
import Fetch from '../Fetch'
import StatusMessage from '../StatusMessage'
import { ConsequenceCategory, DatasetId, VariantConsequence, VariantConsequenceCategoryLabels } from '../Browser'

// @ts-expect-error: no types in this version of @gnomad/ui
import { CategoryFilterControl, KeyboardShortcut, List, ListItem } from '@gnomad/ui'

// @ts-expect-error: no types in this version of @gnomad/region-viewer
import { RegionViewerContext } from '@gnomad/region-viewer'

import BinnedVariantsPlot from './BinnedVariantsPlot'

import {
  CLINICAL_SIGNIFICANCE_CATEGORIES,
  CLINICAL_SIGNIFICANCE_CATEGORY_LABELS,
  CLINICAL_SIGNIFICANCE_CATEGORY_COLORS,
  clinvarVariantClinicalSignificanceCategory,
  ClinicalSignificance,
} from './clinvarVariantCategories'
import { TrackPageSection } from './TrackPage'
import { FiltersFirstColumn, FiltersWrapper, SettingsWrapper } from './VariantFilterControls'
import { Gene } from './VariantsInGene'
import { VariantRow } from './variantTableColumns'
import datasetConfig from '../../datasetConfig'

const TooltipContent = styled.div`
  line-height: 1;
  text-align: left;

  ${List} {
    /* margin-top: 0; */
  }

  ${ListItem} {
    &:last-child {
      margin: 0;
    }
  }

  p {
    margin-bottom: 0.5em;
  }
`

// TK: can be removed when we bump gnomAD browser toolkit version
//    in favor of type from that package
type ScalePosition = {
  (position: number): number
  invert: (x: number) => number
}

type IncludedCategories = {
  [key: string]: boolean
}

const formatTooltip = (bin: any, includedClinicalSignificanceCategories: IncludedCategories) => {
  return (
    <TooltipContent>
      This bin contains:
      <List>
        {CLINICAL_SIGNIFICANCE_CATEGORIES.filter((category) => includedClinicalSignificanceCategories[category]).map(
          (category) => {
            return (
              <ListItem key={category}>
                {/* @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message */}
                {bin[category]} {CLINICAL_SIGNIFICANCE_CATEGORY_LABELS[category].toLowerCase()}{' '}
                variant{bin[category] !== 1 ? 's' : ''}
              </ListItem>
            )
          }
        )}
      </List>
    </TooltipContent>
  )
}

type ClinVarVariant = {
  variant_id: string,
  clinical_variation_id: string,
  rsid: string,

  pos: number,

  clinical_significance: string,
  consequence: string,
  consequenceCategory: string,
  review_status: string,

  gold_stars: number,
  last_evaluated: string,
  major_consequence: string,

  gene_id: string,
  gene_symbol: string,
  transcript_id: string,
  hgvs: string,
  hgvsc: string | null,
  hgvsp: string | null,

  [key: string]: any
}

type ClinVarBinnedVariantsInGeneProps = {
  centerPanelWidth: number,
  scalePosition: ScalePosition,
  clinvarVariants: ClinVarVariant[]
  includedClinicalSignificanceCategories: IncludedCategories
}


const ClinVarBinnedVariantsInGene = ({
  centerPanelWidth,
  scalePosition,
  clinvarVariants,
  includedClinicalSignificanceCategories,
}: ClinVarBinnedVariantsInGeneProps) => {

  return (
    <BinnedVariantsPlot
      width={centerPanelWidth}
      scalePosition={scalePosition}
      variants={clinvarVariants}
      categoryColor={(category: ClinicalSignificance) => CLINICAL_SIGNIFICANCE_CATEGORY_COLORS[category]}
      formatTooltip={(bin: any) => formatTooltip(bin, includedClinicalSignificanceCategories)}
      variantCategory={clinvarVariantClinicalSignificanceCategory}
      variantCategories={CLINICAL_SIGNIFICANCE_CATEGORIES}
    />
  )
}

type ClinicalSignificanceConsequenceCategoryLabels = Record<ClinicalSignificance, string>

interface ClinVarFilterControlsProps {
  filter: ClinVarVariantsInGeneFilter
  setFilter: any
  clinicalSignificanceCategoryLabels?: ClinicalSignificanceConsequenceCategoryLabels
}

const defaultClinicalSignificanceCategoryLables: ClinicalSignificanceConsequenceCategoryLabels = {
  "pathogenic": "Pathogenic / likely pathogenic",
  "uncertain": "Uncertain significance / conflicting",
  "benign": "Benign / likely benign",
  "other": "Other",
}

const ClinVarFilterControls = ({
  filter,
  setFilter,
  clinicalSignificanceCategoryLabels = defaultClinicalSignificanceCategoryLables,
}: ClinVarFilterControlsProps) => {
  return (
    <SettingsWrapper>
      <FiltersWrapper>
        <FiltersFirstColumn>
          <CategoryFilterControl
            categories={CLINICAL_SIGNIFICANCE_CATEGORIES.map((category) => ({
              id: category,
              label: clinicalSignificanceCategoryLabels[category as ClinicalSignificance] || category,
              className: 'category',
              color: CLINICAL_SIGNIFICANCE_CATEGORY_COLORS[category as ClinicalSignificance],
            }))}
            categorySelections={filter.includedClinicalSignificanceCategories}
            id="clinvar-variant-consequence-category-filter"
            onChange={(includeCategories: Record<ClinicalSignificance, boolean>) => {
              setFilter({
                ...filter,
                includedClinicalSignificanceCategories: includeCategories
              })
            }}
          />
        </FiltersFirstColumn>
      </FiltersWrapper>
    </SettingsWrapper>
  )
}

interface ClinVarVariantsInGeneProps {
  leftPanelWidth: number,
  centerPanelWidth: number,
  scalePosition: ScalePosition,
  clinvarVariants: ClinVarVariant[],
  consequenceCategoryLabels: VariantConsequenceCategoryLabels,
}

interface ClinVarVariantsInGeneFilter {
  includedConsequenceCategories: Record<ConsequenceCategory, boolean>
  includedClinicalSignificanceCategories: Record<ClinicalSignificance, boolean>
}


// TK: this is more or less a copy-pasta of gnomAD browser's
//     'ClinVarBinnedVariantsPlots.tsx' file, with some small modifications
//     Here we don't support unbinning for now, instead telling users to go
//     to gnomAD proper for that functionality
// In the future, we should pull this binned component into a shared
//     components repo, like `gnomad-browser-toolkit`
const ClinVarVariantsInGene = ({
  leftPanelWidth,
  centerPanelWidth,
  scalePosition,
  clinvarVariants,
}: ClinVarVariantsInGeneProps) => {
  const defaultFilterState: ClinVarVariantsInGeneFilter = {
    includedClinicalSignificanceCategories: {
      pathogenic: true,
      uncertain: true,
      benign: true,
      other: true,
    },
    includedConsequenceCategories: {
      lof: true,
      missense: true,
      synonymous: true,
      other: true,
    },
  }

  const [filter, setFilter] = useState<ClinVarVariantsInGeneFilter>(defaultFilterState)

  const includedClinicalSignificanceCategories = filter.includedClinicalSignificanceCategories
  const includedClinicalSignificanceCategoriesArray = Object.keys(includedClinicalSignificanceCategories)
    .filter((key) => includedClinicalSignificanceCategories[key as ClinicalSignificance]);
  const filteredClinvarVariants: ClinVarVariant[] = clinvarVariants.filter((clinvarVariant) => {
    return (
      includedClinicalSignificanceCategoriesArray.includes(clinvarVariantClinicalSignificanceCategory(clinvarVariant))
    )
  })

  return (
    <>
      <div style={{ marginBottom: '1em' }}>
        <div style={{ marginLeft: leftPanelWidth }}>
          <ClinVarFilterControls
            filter={filter}
            setFilter={setFilter}
          />
        </div>

        <InnerWrapper>
          <div style={{ width: leftPanelWidth, display: 'flex', alignItems: 'center' }}>
            <p style={{ marginLeft: 0 }}>{`ClinVar variants (${filteredClinvarVariants.length})`}</p>
          </div>
          <div>
            <ClinVarBinnedVariantsInGene
              centerPanelWidth={centerPanelWidth}
              scalePosition={scalePosition}
              clinvarVariants={filteredClinvarVariants}
              includedClinicalSignificanceCategories={filter.includedClinicalSignificanceCategories}
            />
          </div>
        </InnerWrapper>
      </div >
    </>
  )
}

const defaultConsequenceCategoryLabels: VariantConsequenceCategoryLabels = {
  "other": "Other",
  "lof": "LoF",
  "missense": "Missense",
  "synonymous": "Synonymous",
}

interface ClinVarVariantsInGeneContainerProps {
  datasetId: DatasetId
  gene: Gene
  variantConsequences: VariantConsequence[]
  consequenceCategoryLabels?: VariantConsequenceCategoryLabels,
}


const InnerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
`

const ClinVarVariantsInGeneContainer = ({
  datasetId,
  gene,
  variantConsequences,
  consequenceCategoryLabels = defaultConsequenceCategoryLabels,
}: ClinVarVariantsInGeneContainerProps) => {
  // @ts-expect-error - no types from RegionViewerContext in this GBTK version
  const { leftPanelWidth, centerPanelWidth, scalePosition } = useContext(RegionViewerContext)

  const datasetsWithClinVar: DatasetId[] = ['GP2']
  const givenDatasetHasClinvar = datasetsWithClinVar.indexOf(datasetId) !== -1
  if (!givenDatasetHasClinvar) {
    return null
  }

  return (
    <Fetch path={`/gene/${gene.gene_id}/variants?dataset=ClinVarGRCh38`}>
      {({
        data: clinvarData,
        error: clinvarError,
        loading: clinvarLoading }) => {

        if (clinvarLoading) {
          return <StatusMessage>Loading variants...</StatusMessage>
        }

        if (clinvarError || !(clinvarData || {}).variants) {
          return <StatusMessage>Unable to load variants</StatusMessage>
        }

        const consequences: Record<string, { label: string; category: string }> = {}
        variantConsequences.forEach((csq) => {
          consequences[csq.term] = {
            label: csq.label || csq.term,
            category: csq.category || 'other',
          }
        })

        const windowObjectHasClinvarMetadata = datasetConfig.clinvar
        if (!windowObjectHasClinvarMetadata) {
          return (
            <>No ClinVar variants found</>
          )
        } else {
          const clinvarVariants: ClinVarVariant[] = clinvarData.variants.map((rawClinvarVariant: VariantRow[]) => {
            const clinvarVariant: {
              [key: string]: any
            } = {}

            datasetConfig.clinvar!.variant_fields
              .filter((field) => ['group_results'].indexOf(field) === -1)
              .forEach((field, fieldIndex) => {
                if (field === 'info') {
                  datasetConfig.clinvar!.variant_info_field_names
                    .forEach((infoField, infoFieldIndex) => {
                      clinvarVariant[infoField] = rawClinvarVariant[fieldIndex][infoFieldIndex]
                    })
                } else {
                  clinvarVariant[field] = rawClinvarVariant[fieldIndex]
                }
              })

            clinvarVariant.hgvs = clinvarVariant.hgvsp || clinvarVariant.hgvsc

            if (clinvarVariant.consequence) {
              clinvarVariant.consequenceCategory =
                (consequences[clinvarVariant.consequence] || {}).category || 'other'
              clinvarVariant.consequence =
                (consequences[clinvarVariant.consequence] || {}).label || clinvarVariant.consequence
            } else {
              clinvarVariant.consequenceCategory = 'other'
            }

            return clinvarVariant
          })


          return (
            <ClinVarVariantsInGene
              leftPanelWidth={leftPanelWidth}
              centerPanelWidth={centerPanelWidth}
              scalePosition={scalePosition}
              clinvarVariants={clinvarVariants}
              consequenceCategoryLabels={consequenceCategoryLabels}
            />
          )
        }

      }}
    </Fetch>
  )
}

export default ClinVarVariantsInGeneContainer
