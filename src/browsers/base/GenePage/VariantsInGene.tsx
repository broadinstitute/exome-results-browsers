import { get, throttle } from 'lodash'
// import PropTypes from 'prop-types'
import React, { Component, ComponentType } from 'react'
import { createGlobalStyle } from 'styled-components'

// @ts-expect-error: this version of @gnomad/... doesn't have types
import { Cursor, PositionAxisTrack } from '@gnomad/region-viewer'
// @ts-expect-error: this version of @gnomad/... doesn't have types
import VariantTrack from '@gnomad/track-variants'
// @ts-expect-error: this version of @gnomad/... doesn't have types
import { Modal } from '@gnomad/ui'

import datasetConfig from '../../datasetConfig'
import Fetch from '../Fetch'
import StatusMessage from '../StatusMessage'
import { TrackPageSection } from './TrackPage'
import VariantDetails from './VariantDetails'
import VariantFilterControls, { FilterState } from './VariantFilterControls'
import VariantTable, { SortOrder } from './VariantTable'
import getVariantTableColumns, { VariantRow, VariantTableColumn } from './variantTableColumns'
import {
  ConsequenceCategory,
  ReferenceGenome,
  VariantColumnConfig,
  VariantConsequenceCategoryLabels,
} from '../Browser'

const consequenceCategoryColors: Record<ConsequenceCategory, string> = {
  lof: 'rgba(255, 88, 63, 0.7)',
  missense: 'rgba(240, 201, 77, 0.7)',
  synonymous: 'rgba(0, 128, 0, 0.7)',
  other: 'rgba(117, 117, 117, 0.7)',
}

const variantColor = (variant: VariantRow) => consequenceCategoryColors[variant.consequenceCategory]

const ModalStyles = createGlobalStyle`
  #variant-details-modal .modal-content {
    max-width: none !important;
  }
`

const selectGroupResult = (variants: VariantRow[], group: string) => {
  return variants
    .filter((v) => v.group_results[group])
    .map((v) => ({ ...v, group_result: v.group_results[group] }))
}

// TK: TODO: fixme: this type could possibly be GeneRow from Browser.tsx
interface Gene {
  gene_id: string
  reference_genome: ReferenceGenome
}

interface VariantCustomFilter {
  component: ComponentType<any>
  defaultFilter: any
  applyFilter: (variants: VariantRow[], filterState: any) => VariantRow[]
}

interface VariantsInGeneProps {
  datasetId: string
  variantAnalysisGroupOptions: string[]
  defaultVariantAnalysisGroup: string
  variantAnalysisGroupLabels: { [key: string]: string }
  variantSortKey?: string
  variantSortOrder?: SortOrder
  variantResultColumns: VariantColumnConfig[]
  variantConsequenceCategoryLabels: VariantConsequenceCategoryLabels
  variantCustomFilter: VariantCustomFilter
  additionalVariantDetailSummaryColumns?: VariantColumnConfig[]
  renderVariantAttributes: (record: any) => any
  variantDetailColumns?: VariantColumnConfig[]
  renderVariantTranscriptConsequences: boolean
  gene: Gene
  variants: VariantRow[]
}

interface VariantsInGeneState {
  datasetId: string
  filter: FilterState
  hoveredVariant: string | null
  rowIndexLastClickedInNavigator: number | null
  renderedVariants: VariantRow[]
  selectedAnalysisGroup: string
  selectedVariant: VariantRow | null
  sortKey: string
  sortOrder: SortOrder
  visibleVariantWindow: [number, number]
}

class VariantsInGene extends Component<VariantsInGeneProps, VariantsInGeneState> {
  static defaultProps = {
    variantAnalysisGroupLabels: {},
    variantConsequenceCategoryLabels: undefined,
    variantCustomFilter: undefined,
    renderVariantAttributes: undefined,
    additionalVariantDetailSummaryColumns: undefined,
    variantDetailColumns: undefined,
    renderVariantTranscriptConsequences: false,
  }

  tableColumns: VariantTableColumn[]

  constructor(props: VariantsInGeneProps) {
    super(props)

    const defaultFilter: FilterState = {
      includeCategories: {
        lof: true,
        missense: true,
        synonymous: true,
        other: true,
      },
      searchText: '',
      custom: (props.variantCustomFilter || {}).defaultFilter,
    }

    this.tableColumns = getVariantTableColumns(
      props.variantResultColumns.filter((c) => c.showOnGenePage !== false)
    )

    const renderedVariants = this.sortVariants(
      this.filterVariants(
        selectGroupResult(props.variants, props.defaultVariantAnalysisGroup),
        defaultFilter
      ),
      {
        sortKey: props.variantSortKey || 'variant_id',
        sortOrder: props.variantSortOrder || 'ascending',
      }
    )

    this.state = {
      datasetId: props.datasetId,
      filter: defaultFilter,
      hoveredVariant: null,
      rowIndexLastClickedInNavigator: 0,
      renderedVariants,
      selectedAnalysisGroup: props.defaultVariantAnalysisGroup,
      selectedVariant: null,
      sortKey: props.variantSortKey || 'variant_id',
      sortOrder: props.variantSortOrder || 'ascending',
      visibleVariantWindow: [0, 19],
    }
  }

  onChangeAnalysisGroup = (analysisGroup: string) => {
    this.setState((state) => {
      const { variants } = this.props
      const { filter, sortKey, sortOrder } = state
      const renderedVariants = this.sortVariants(
        this.filterVariants(selectGroupResult(variants, analysisGroup), filter),
        {
          sortKey,
          sortOrder,
        }
      )

      return {
        renderedVariants,
        selectedAnalysisGroup: analysisGroup,
      }
    })
  }

  onChangeFilter = (newFilter: FilterState) => {
    this.setState((state) => {
      const { variants } = this.props
      const { selectedAnalysisGroup, sortKey, sortOrder } = state
      const renderedVariants = this.sortVariants(
        this.filterVariants(selectGroupResult(variants, selectedAnalysisGroup), newFilter),
        {
          sortKey,
          sortOrder,
        }
      )

      return {
        filter: newFilter,
        renderedVariants,
      }
    })
  }

  onClickVariant = (variant: VariantRow) => {
    this.setState({ selectedVariant: variant })
  }

  onHoverVariant = (variantId: string) => {
    this.setState({ hoveredVariant: variantId })
  }

  onSort = (newSortKey: string) => {
    this.setState((state) => {
      const { renderedVariants, sortKey } = state

      let newSortOrder: SortOrder = 'descending'
      if (newSortKey === sortKey) {
        newSortOrder = state.sortOrder === 'ascending' ? 'descending' : 'ascending'
      }

      // Since the filter hasn't changed, sort the currently rendered variants instead
      // of filtering the input variants.
      const sortedVariants = this.sortVariants(renderedVariants, {
        sortKey: newSortKey,
        sortOrder: newSortOrder,
      })

      return {
        renderedVariants: sortedVariants,
        sortKey: newSortKey,
        sortOrder: newSortOrder,
      }
    })
  }

  onVisibleRowsChange = throttle(({ startIndex, stopIndex }) => {
    this.setState({ visibleVariantWindow: [startIndex, stopIndex] })
  }, 100)

  onClickPosition = (position: number) => {
    const { renderedVariants } = this.state
    const sortedVariants = this.sortVariants(renderedVariants, {
      sortKey: 'variant_id',
      sortOrder: 'ascending',
    })

    let index
    if (sortedVariants.length === 0 || position < sortedVariants[0].pos) {
      index = 0
    } else {
      index = sortedVariants.findIndex(
        (variant, i) =>
          sortedVariants[i + 1] && position >= variant.pos && position <= sortedVariants[i + 1].pos
      )

      if (index === -1) {
        index = sortedVariants.length - 1
      }
    }

    this.setState({
      renderedVariants: sortedVariants,
      rowIndexLastClickedInNavigator: index,
      sortKey: 'variant_id',
      sortOrder: 'ascending',
    })
  }

  filterVariants(variants: VariantRow[], filter: FilterState) {
    const { variantCustomFilter } = this.props

    let filteredVariants = variants

    const isEveryConsequenceCategorySelected =
      filter.includeCategories.lof &&
      filter.includeCategories.missense &&
      filter.includeCategories.synonymous &&
      filter.includeCategories.other

    if (!isEveryConsequenceCategorySelected) {
      filteredVariants = variants.filter((variant) => {
        return filter.includeCategories[variant.consequenceCategory]
      })
    }

    if (filter.searchText) {
      const query = filter.searchText.toLowerCase()
      filteredVariants = filteredVariants.filter(
        (v) =>
          v.variant_id.toLowerCase().includes(query) ||
          (v.consequence || '').toLowerCase().includes(query) ||
          (v.hgvsc || '').toLowerCase().includes(query) ||
          (v.hgvsp || '').toLowerCase().includes(query)
      )
    }

    if (variantCustomFilter) {
      filteredVariants = variantCustomFilter.applyFilter(filteredVariants, filter.custom)
    }

    return filteredVariants
  }

  sortVariants = (
    variants: VariantRow[],
    { sortKey, sortOrder }: { sortKey: string; sortOrder: SortOrder }
  ): VariantRow[] => {
    const column = this.tableColumns.find((c) => c.key === sortKey)

    if (!column) {
      return variants
    }

    const baseSortFunction = column.sortFunction
    const sortFunction =
      sortOrder === 'ascending' ? baseSortFunction : (a: any, b: any) => baseSortFunction(b, a)

    return [...variants].sort((variant1, variant2) => {
      const sortValue1 = get(variant1, column.sortKey)
      const sortValue2 = get(variant2, column.sortKey)

      // Always sort null values to end of list
      if (sortValue1 === undefined || sortValue1 === null || sortValue1 === '') {
        return 1
      }
      if (sortValue2 === undefined || sortValue2 === null || sortValue2 === '') {
        return -1
      }
      return sortFunction(sortValue1, sortValue2)
    })
  }

  render() {
    const {
      gene,
      defaultVariantAnalysisGroup,
      variantAnalysisGroupLabels,
      variantAnalysisGroupOptions,
      variantResultColumns,
      variantConsequenceCategoryLabels,
      variantCustomFilter,
      renderVariantAttributes,
      additionalVariantDetailSummaryColumns,
      variantDetailColumns,
      renderVariantTranscriptConsequences,
    } = this.props

    const {
      filter,
      hoveredVariant,
      renderedVariants,
      rowIndexLastClickedInNavigator,
      selectedAnalysisGroup,
      selectedVariant,
      sortKey,
      sortOrder,
      visibleVariantWindow,
    } = this.state

    // For GP2, we use e.g. 'wgs_ac_case', rather than just 'ac_case'
    const { datasetId } = this.state
    const prefix = datasetId === 'GP2' ? 'wgs_' : ''

    const cases = renderedVariants
      .filter((v) => v.group_result[`${prefix}ac_case`] > 0)
      .map((v) => ({ ...v, allele_freq: v.group_result[`${prefix}af_case`] }))
    const controls = renderedVariants
      .filter((v) => v.group_result[`${prefix}ac_ctrl`] > 0)
      .map((v) => ({ ...v, allele_freq: v.group_result[`${prefix}af_ctrl`] }))

    return (
      <>
        <VariantTrack
          title={`Cases\n(${cases.length} variants)`}
          variants={cases}
          variantColor={variantColor}
        />
        <VariantTrack
          title={`Controls\n(${controls.length} variants)`}
          variants={controls}
          variantColor={variantColor}
        />
        <Cursor onClick={this.onClickPosition}>
          <VariantTrack
            title="Viewing in table"
            variants={renderedVariants
              .slice(visibleVariantWindow[0], visibleVariantWindow[1] + 1)
              .map((v) => ({
                ...v,
                allele_freq: v.group_result[`${prefix}af`],
                isHighlighted: v.variant_id === hoveredVariant,
              }))}
            variantColor={variantColor}
          />
        </Cursor>
        <PositionAxisTrack />
        <TrackPageSection style={{ fontSize: '14px', marginTop: '1em' }}>
          <VariantFilterControls
            consequenceCategoryLabels={variantConsequenceCategoryLabels}
            filter={filter}
            onChangeFilter={this.onChangeFilter}
            customFilterComponent={(variantCustomFilter || {}).component}
            geneId={gene.gene_id}
            renderedVariants={renderedVariants}
            variantTableColumns={this.tableColumns}
            variantAnalysisGroupLabels={variantAnalysisGroupLabels}
            variantAnalysisGroupOptions={variantAnalysisGroupOptions}
            selectedAnalysisGroup={selectedAnalysisGroup}
            onChangeAnalysisGroup={this.onChangeAnalysisGroup}
          />
          <VariantTable
            columns={this.tableColumns}
            highlightText={filter.searchText}
            onClickVariant={this.onClickVariant}
            onHoverVariant={this.onHoverVariant}
            onRequestSort={this.onSort}
            onVisibleRowsChange={this.onVisibleRowsChange}
            rowIndexLastClickedInNavigator={rowIndexLastClickedInNavigator}
            sortKey={sortKey}
            sortOrder={sortOrder}
            variants={renderedVariants}
          />
        </TrackPageSection>
        <ModalStyles />
        {selectedVariant && (
          <Modal
            id="variant-details-modal"
            size="large"
            title={`${selectedVariant.variant_id} (${gene.reference_genome})`}
            onRequestClose={() => {
              this.setState({ selectedVariant: null })
            }}
          >
            <VariantDetails
              defaultVariantAnalysisGroup={defaultVariantAnalysisGroup}
              referenceGenome={gene.reference_genome}
              variant={selectedVariant}
              variantAnalysisGroupOptions={variantAnalysisGroupOptions}
              variantAnalysisGroupLabels={variantAnalysisGroupLabels}
              variantResultColumns={variantResultColumns.filter((c) => c.showOnDetails !== false)}
              renderVariantAttributes={renderVariantAttributes}
              additionalVariantDetailSummaryColumns={additionalVariantDetailSummaryColumns}
              variantDetailColumns={variantDetailColumns}
              renderVariantTranscriptConsequences={renderVariantTranscriptConsequences}
            />
          </Modal>
        )}
      </>
    )
  }
}

const addSingleAF = (args: { groupResult: any; prefix: string; suffix: string }) => {
  const { groupResult, prefix, suffix } = args

  const ac = groupResult[`${prefix}ac_${suffix}`]
  const an = groupResult[`${prefix}an_${suffix}`]
  let af = null

  if (ac === null || an === null) {
    af = null
  } else if (an === 0) {
    af = 0
  } else {
    af = ac / an
  }

  groupResult[`${prefix}af_${suffix}`] = af
}

const addOverallAF = (args: { groupResult: any; prefix: string }) => {
  const { groupResult, prefix } = args

  const caseAC = groupResult[`${prefix}ac_case`]
  const caseAN = groupResult[`${prefix}an_case`]
  const controlAC = groupResult[`${prefix}ac_ctrl`]
  const controlAN = groupResult[`${prefix}an_ctrl`]
  const caseAF = groupResult[`${prefix}af_case`]
  const controlAF = groupResult[`${prefix}af_ctrl`]

  let overallAF = null

  if (caseAF === null || controlAF === null) {
    overallAF = null
  } else if (caseAN + controlAN === 0) {
    overallAF = 0
  } else {
    overallAF = (caseAC + controlAC) / (caseAN + controlAN)
  }

  groupResult[`${prefix}af`] = overallAF
}

interface VariantConsequence {
  term: string
  label?: string
  category?: ConsequenceCategory
}

interface VariantsInGeneContainerProps {
  datasetId: string
  gene: Gene
  variantConsequences: VariantConsequence[]
  variantAnalysisGroupOptions?: string[]
  defaultVariantAnalysisGroup?: string
  variantResultColumns: VariantColumnConfig[]
  [key: string]: any
}

const VariantsInGeneContainer = ({
  datasetId,
  gene,
  variantConsequences,
  variantAnalysisGroupOptions = undefined,
  defaultVariantAnalysisGroup = undefined,
  variantResultColumns,
  ...otherProps
}: VariantsInGeneContainerProps) => {
  return (
    <Fetch path={`/gene/${gene.gene_id}/variants`}>
      {({ data, error, loading }) => {
        if (loading) {
          return <StatusMessage>Loading variants...</StatusMessage>
        }

        if (error || !(data || {}).variants) {
          return <StatusMessage>Unable to load variants</StatusMessage>
        }

        const consequences: Record<string, { label: string; category: string }> = {}
        variantConsequences.forEach((csq) => {
          consequences[csq.term] = {
            label: csq.label || csq.term,
            category: csq.category || 'other',
          }
        })

        const variants = data.variants.map((variantValues: VariantRow[]) => {
          const variant: {
            info: Record<string, any>
            group_results: Record<string, any>
            [key: string]: any
          } = {
            info: {},
            group_results: {},
          }

          datasetConfig.variant_fields.forEach((field, fieldIndex) => {
            if (field === 'info') {
              datasetConfig.variant_info_field_names.forEach((infoField, infoFieldIndex) => {
                variant.info[infoField] = variantValues[fieldIndex][infoFieldIndex]
              })
            } else if (field === 'group_results') {
              datasetConfig.variant_result_analysis_groups.forEach((group, groupIndex) => {
                const groupResultValues = variantValues[fieldIndex][groupIndex]

                if (groupResultValues) {
                  const groupResult: { [key: string]: string } = {}
                  datasetConfig.variant_group_result_field_names.forEach(
                    (groupResultField, groupResultFieldIndex) => {
                      groupResult[groupResultField] = groupResultValues[groupResultFieldIndex]
                    }
                  )

                  if (datasetId !== 'GP2') {
                    addSingleAF({ groupResult, prefix: '', suffix: 'case' })
                    addSingleAF({ groupResult, prefix: '', suffix: 'ctrl' })
                    addOverallAF({ groupResult, prefix: '' })
                  }

                  if (datasetId === 'GP2') {
                    addSingleAF({ groupResult, prefix: 'wgs_', suffix: 'case' })
                    addSingleAF({ groupResult, prefix: 'wgs_', suffix: 'ctrl' })
                    addSingleAF({ groupResult, prefix: 'wgs_', suffix: 'other' })
                    addSingleAF({ groupResult, prefix: 'ces_', suffix: 'case' })
                    addOverallAF({ groupResult, prefix: 'wgs_' })
                  }

                  variant.group_results[group] = groupResult
                }
              })
            } else {
              variant[field] = variantValues[fieldIndex]
            }
          })

          variant.hgvs = variant.hgvsp || variant.hgvsc

          if (variant.consequence) {
            variant.consequenceCategory =
              (consequences[variant.consequence] || {}).category || 'other'
            variant.consequence =
              (consequences[variant.consequence] || {}).label || variant.consequence
          } else {
            variant.consequenceCategory = 'other'
          }

          return variant
        })

        return (
          <VariantsInGene
            {...otherProps}
            variantAnalysisGroupOptions={
              variantAnalysisGroupOptions || datasetConfig.variant_result_analysis_groups
            }
            defaultVariantAnalysisGroup={
              defaultVariantAnalysisGroup || datasetConfig.variant_result_analysis_groups[0]
            }
            gene={gene}
            variants={variants}
            datasetId={datasetId}
            variantResultColumns={variantResultColumns}
          />
        )
      }}
    </Fetch>
  )
}

export default VariantsInGeneContainer
