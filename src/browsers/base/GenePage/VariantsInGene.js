import { get, throttle } from 'lodash'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { createGlobalStyle } from 'styled-components'

import { Cursor, PositionAxisTrack } from '@gnomad/region-viewer'
import VariantTrack from '@gnomad/track-variant'
import { Modal } from '@gnomad/ui'

import datasetConfig from '../../datasetConfig'
import Fetch from '../Fetch'
import StatusMessage from '../StatusMessage'
import { TrackPageSection } from './TrackPage'
import VariantDetails from './VariantDetails'
import VariantFilterControls from './VariantFilterControls'
import VariantTable from './VariantTable'
import getVariantTableColumns from './variantTableColumns'

const consequenceCategoryColors = {
  lof: 'rgba(255, 88, 63, 0.7)',
  missense: 'rgba(240, 201, 77, 0.7)',
  synonymous: 'rgba(0, 128, 0, 0.7)',
  other: 'rgba(117, 117, 117, 0.7)',
}

const variantColor = (variant) => consequenceCategoryColors[variant.consequenceCategory]

const ModalStyles = createGlobalStyle`
  #variant-details-modal .modal-content {
    max-width: none !important;
  }
`

const selectGroupResult = (variants, group) => {
  return variants
    .filter((v) => v.group_results[group])
    .map((v) => ({ ...v, group_result: v.group_results[group] }))
}

class VariantsInGene extends Component {
  constructor(props) {
    super(props)

    const defaultFilter = {
      includeCategories: {
        lof: true,
        missense: true,
        synonymous: true,
        other: true,
      },
      searchText: '',
      custom: (props.variantCustomFilter || {}).defaultFilter,
    }

    const defaultSortKey = 'variant_id'
    const defaultSortOrder = 'ascending'

    this.tableColumns = getVariantTableColumns(
      props.variantResultColumns.filter((c) => c.showOnGenePage !== false)
    )

    const renderedVariants = this.sortVariants(
      this.filterVariants(
        selectGroupResult(props.variants, props.defaultVariantAnalysisGroup),
        defaultFilter
      ),
      {
        sortKey: defaultSortKey,
        sortOrder: defaultSortOrder,
      }
    )

    this.state = {
      filter: defaultFilter,
      hoveredVariant: null,
      rowIndexLastClickedInNavigator: 0,
      renderedVariants,
      selectedAnalysisGroup: props.defaultVariantAnalysisGroup,
      selectedVariant: null,
      sortKey: defaultSortKey,
      sortOrder: defaultSortOrder,
      visibleVariantWindow: [0, 19],
    }
  }

  onChangeAnalysisGroup = (analysisGroup) => {
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

  onChangeFilter = (newFilter) => {
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

  onClickVariant = (variant) => {
    this.setState({ selectedVariant: variant })
  }

  onHoverVariant = (variantId) => {
    this.setState({ hoveredVariant: variantId })
  }

  onSort = (newSortKey) => {
    this.setState((state) => {
      const { renderedVariants, sortKey } = state

      let newSortOrder = 'descending'
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

  onClickPosition = (position) => {
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

  filterVariants(variants, filter) {
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

  sortVariants(variants, { sortKey, sortOrder }) {
    const column = this.tableColumns.find((c) => c.key === sortKey)

    const baseSortFunction = column.sortFunction
    const sortFunction =
      sortOrder === 'ascending' ? baseSortFunction : (a, b) => baseSortFunction(b, a)

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
      variantCustomFilter,
      renderVariantAttributes,
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

    const cases = renderedVariants
      .filter((v) => v.group_result.ac_case > 0)
      .map((v) => ({ ...v, allele_freq: v.group_result.af_case }))
    const controls = renderedVariants
      .filter((v) => v.group_result.ac_ctrl > 0)
      .map((v) => ({ ...v, allele_freq: v.group_result.af_ctrl }))

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
                allele_freq: v.group_result.af,
                isHighlighted: v.variant_id === hoveredVariant,
              }))}
            variantColor={variantColor}
          />
        </Cursor>
        <PositionAxisTrack />
        <TrackPageSection style={{ fontSize: '14px', marginTop: '1em' }}>
          <VariantFilterControls
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
              variantAnalysisGroupLabels={variantAnalysisGroupLabels}
              variantResultColumns={variantResultColumns.filter((c) => c.showOnDetails !== false)}
              renderVariantAttributes={renderVariantAttributes}
            />
          </Modal>
        )}
      </>
    )
  }
}

VariantsInGene.propTypes = {
  variantAnalysisGroupOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  defaultVariantAnalysisGroup: PropTypes.string.isRequired,
  variantAnalysisGroupLabels: PropTypes.objectOf(PropTypes.string),
  variantResultColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      heading: PropTypes.string,
      minWidth: PropTypes.number,
      tooltip: PropTypes.string,
      render: PropTypes.func,
      renderForCSV: PropTypes.func,
      showOnDetails: PropTypes.bool,
      showOnGenePage: PropTypes.bool,
    })
  ).isRequired,
  variantCustomFilter: PropTypes.shape({
    component: PropTypes.func.isRequired,
    defaultFilter: PropTypes.any.isRequired,
    applyFilter: PropTypes.func.isRequired,
  }),
  renderVariantAttributes: PropTypes.func,
  gene: PropTypes.shape({
    reference_genome: PropTypes.oneOf(['GRCh37', 'GRCh38']).isRequired,
    gene_id: PropTypes.string.isRequired,
  }).isRequired,
  variants: PropTypes.arrayOf(
    PropTypes.shape({
      variant_id: PropTypes.string.isRequired,
      pos: PropTypes.number.isRequired,
      consequence: PropTypes.string,
      consequenceCategory: PropTypes.oneOf(['lof', 'missense', 'synonymous', 'other']).isRequired,
      hgvsp: PropTypes.string,
      hgvsc: PropTypes.string,
      group_results: PropTypes.objectOf(
        PropTypes.shape({
          ac_case: PropTypes.number,
          an_case: PropTypes.number,
          af_case: PropTypes.number,
          ac_ctrl: PropTypes.number,
          an_ctrl: PropTypes.number,
          af_ctrl: PropTypes.number,
          af: PropTypes.number,
        })
      ),
    })
  ).isRequired,
}

VariantsInGene.defaultProps = {
  variantAnalysisGroupLabels: {},
  variantCustomFilter: undefined,
  renderVariantAttributes: undefined,
}

const VariantsInGeneContainer = ({
  gene,
  variantConsequences,
  variantAnalysisGroupOptions,
  defaultVariantAnalysisGroup,
  ...otherProps
}) => {
  return (
    <Fetch path={`/gene/${gene.gene_id}/variants`}>
      {({ data, error, loading }) => {
        if (loading) {
          return <StatusMessage>Loading variants...</StatusMessage>
        }

        if (error || !(data || {}).variants) {
          return <StatusMessage>Unable to load variants</StatusMessage>
        }

        const consequences = {}
        variantConsequences.forEach((csq) => {
          consequences[csq.term] = {
            label: csq.label || csq.term,
            category: csq.category || 'other',
          }
        })

        const variants = data.variants.map((variantValues) => {
          const variant = {
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
                  const groupResult = {}
                  datasetConfig.variant_group_result_field_names.forEach(
                    (groupResultField, groupResultFieldIndex) => {
                      groupResult[groupResultField] = groupResultValues[groupResultFieldIndex]
                    }
                  )

                  if (groupResult.ac_case === null || groupResult.an_case === null) {
                    groupResult.af_case = null
                  } else if (groupResult.an_case === 0) {
                    groupResult.af_case = 0
                  } else {
                    groupResult.af_case = groupResult.ac_case / groupResult.an_case
                  }

                  if (groupResult.ac_ctrl === null || groupResult.an_ctrl === null) {
                    groupResult.af_ctrl = null
                  } else if (groupResult.an_ctrl === 0) {
                    groupResult.af_ctrl = 0
                  } else {
                    groupResult.af_ctrl = groupResult.ac_ctrl / groupResult.an_ctrl
                  }

                  if (groupResult.af_case === null || groupResult.af_ctrl === null) {
                    groupResult.af = null
                  } else if (groupResult.an_case + groupResult.an_ctrl === 0) {
                    groupResult.af = 0
                  } else {
                    groupResult.af =
                      (groupResult.ac_case + groupResult.ac_ctrl) /
                      (groupResult.an_case + groupResult.an_ctrl)
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
          />
        )
      }}
    </Fetch>
  )
}

VariantsInGeneContainer.propTypes = {
  variantAnalysisGroupOptions: PropTypes.arrayOf(PropTypes.string),
  defaultVariantAnalysisGroup: PropTypes.string,
  variantConsequences: PropTypes.arrayOf(
    PropTypes.shape({
      term: PropTypes.string.isRequired,
      label: PropTypes.string,
      category: PropTypes.oneOf(['lof', 'missense', 'synonymous', 'other']),
    })
  ).isRequired,
  gene: PropTypes.shape({
    gene_id: PropTypes.string.isRequired,
  }).isRequired,
}

VariantsInGeneContainer.defaultProps = {
  variantAnalysisGroupOptions: undefined,
  defaultVariantAnalysisGroup: undefined,
}

export default VariantsInGeneContainer
