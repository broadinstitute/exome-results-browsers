import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { CategoryFilterControl, Combobox, KeyboardShortcut, SearchInput } from '@gnomad/ui'

import CSVExportButton from '../CSVExportButton'

const consequenceCategoryColors = {
  lof: '#FF583F',
  missense: '#F0C94D',
  synonymous: 'green',
  other: '#757575',
}

const consequenceCategoryLabels = {
  lof: 'LoF',
  missense: 'Missense',
  synonymous: 'Synonymous',
  other: 'Other',
}

const SettingsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;

  @media (max-width: 1100px) {
    flex-direction: column;
  }
`

const FiltersWrapper = styled.div`
  display: flex;
  flex-grow: 2;
  flex-direction: row;
  justify-content: space-between;

  @media (max-width: 1350px) {
    flex-direction: column;
  }

  @media (max-width: 700px) {
    align-items: center;
  }
`

const AnalysisGroupMenuWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1em;

  @media (max-width: 700px) {
    flex-direction: column;
  }

  @media (min-width: 701px) {
    > * {
      margin-right: 0.5em;
    }
  }
`

const FiltersFirstColumn = styled.div`
  display: flex;
  flex-direction: column;

  @media (max-width: 700px) {
    align-items: center;
  }
`

const FiltersSecondColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  label {
    margin-bottom: 0.375em;
  }

  @media (max-width: 1350px) {
    flex-direction: row;
    justify-content: flex-start;
    margin-top: 1em;

    label {
      margin-right: 2em;
    }
  }

  @media (max-width: 700px) {
    flex-direction: column;
  }
`

const SearchWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: flex-end;

  @media (max-width: 1100px) {
    margin-top: 0.525em;
  }
`

const keyboardShortcuts = {
  lof: 'l',
  missense: 'm',
  synonymous: 's',
  other: 'o',
}

const VariantFilterControls = ({
  customFilterComponent: CustomFilterComponent,
  filter,
  geneId,
  onChangeAnalysisGroup,
  onChangeFilter,
  renderedVariants,
  selectedAnalysisGroup,
  variantAnalysisGroupLabels,
  variantAnalysisGroupOptions,
  variantTableColumns,
}) => {
  return (
    <SettingsWrapper>
      <FiltersWrapper>
        <FiltersFirstColumn>
          <CategoryFilterControl
            categories={['lof', 'missense', 'synonymous', 'other'].map((category) => ({
              id: category,
              label: consequenceCategoryLabels[category],
              className: 'category',
              color: consequenceCategoryColors[category],
            }))}
            categorySelections={filter.includeCategories}
            id="variant-consequence-category-filter"
            onChange={(includeCategories) => {
              onChangeFilter({ ...filter, includeCategories })
            }}
          />
          {Object.keys(keyboardShortcuts).map((category) => (
            <KeyboardShortcut
              key={category}
              handler={() => {
                onChangeFilter({
                  ...filter,
                  includeCategories: {
                    ...filter.includeCategories,
                    [category]: !filter.includeCategories[category],
                  },
                })
              }}
              keys={keyboardShortcuts[category]}
            />
          ))}

          <AnalysisGroupMenuWrapper>
            {variantAnalysisGroupOptions.length > 1 && (
              <>
                {/* eslint-disable-next-line jsx-a11y/label-has-for,jsx-a11y/label-has-associated-control */}
                <label htmlFor="analysis-group">Current analysis group</label>
                <Combobox
                  id="analysis-group"
                  options={variantAnalysisGroupOptions.map((group) => ({
                    id: group,
                    label: variantAnalysisGroupLabels[group] || group,
                  }))}
                  onSelect={(option) => onChangeAnalysisGroup(option.id)}
                  value={variantAnalysisGroupLabels[selectedAnalysisGroup] || selectedAnalysisGroup}
                />
              </>
            )}

            <CSVExportButton
              data={renderedVariants}
              columns={variantTableColumns}
              filename={`${selectedAnalysisGroup}_${geneId}_variants`}
            >
              Export variants to CSV
            </CSVExportButton>
          </AnalysisGroupMenuWrapper>
        </FiltersFirstColumn>

        <FiltersSecondColumn>
          {CustomFilterComponent && (
            <CustomFilterComponent
              value={filter.custom}
              onChange={(customFilter) => {
                onChangeFilter({ ...filter, custom: customFilter })
              }}
            />
          )}
        </FiltersSecondColumn>
      </FiltersWrapper>

      <SearchWrapper>
        <SearchInput
          placeholder="Search variant table"
          value={filter.searchText}
          onChange={(searchText) => {
            onChangeFilter({ ...filter, searchText })
          }}
        />
      </SearchWrapper>
    </SettingsWrapper>
  )
}

VariantFilterControls.propTypes = {
  filter: PropTypes.shape({
    includeCategories: PropTypes.shape({
      lof: PropTypes.bool.isRequired,
      missense: PropTypes.bool.isRequired,
      synonymous: PropTypes.bool.isRequired,
      other: PropTypes.bool.isRequired,
    }).isRequired,
    searchText: PropTypes.string.isRequired,
    custom: PropTypes.any,
  }).isRequired,
  customFilterComponent: PropTypes.func,
  geneId: PropTypes.string.isRequired,
  onChangeAnalysisGroup: PropTypes.func.isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  renderedVariants: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedAnalysisGroup: PropTypes.string.isRequired,
  variantAnalysisGroupLabels: PropTypes.objectOf(PropTypes.string).isRequired,
  variantAnalysisGroupOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  variantTableColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
}

VariantFilterControls.defaultProps = {
  customFilterComponent: undefined,
}

export default VariantFilterControls
