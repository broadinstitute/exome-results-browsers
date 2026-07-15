import React from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this version of @gnomad/ui
import { CategoryFilterControl, Checkbox, KeyboardShortcut, SearchInput, Select } from '@gnomad/ui'

import CSVExportButton from '../CSVExportButton'
import { ConsequenceCategory, DatasetId, VariantConsequenceCategoryLabels } from '../Browser'
import { VariantRow, VariantTableColumn } from './variantTableColumns'

export const consequenceCategoryColors = {
  lof: '#FF583F',
  missense: '#F0C94D',
  synonymous: 'green',
  other: '#757575',
}

export const SettingsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;

  @media (max-width: 1100px) {
    flex-direction: column;
  }
`

export const FiltersWrapper = styled.div`
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

export const FiltersFirstColumn = styled.div`
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

export const keyboardShortcuts: Record<ConsequenceCategory, string> = {
  lof: 'l',
  missense: 'm',
  synonymous: 's',
  other: 'o',
}

export interface FilterState {
  includeCategories: Record<ConsequenceCategory, boolean>
  searchText: string
  custom: any // TK: TODO: fixme: any!!,
  gp2VariantColumnGroups?: Record<string, boolean>;
}

interface VariantFilterControlProps {
  datasetId: DatasetId
  consequenceCategoryLabels: VariantConsequenceCategoryLabels
  customFilterComponent: any
  filter: FilterState
  geneId: string
  onChangeAnalysisGroup: (analysisGroup: string) => void
  onChangeFilter: (filter: FilterState) => void
  renderedVariants: VariantRow[]
  selectedAnalysisGroup: string
  variantAnalysisGroupLabels: Record<string, string>
  variantAnalysisGroupOptions: string[]
  variantTableColumns: VariantTableColumn[]
}

export const lofCategories: ConsequenceCategory[] = ['lof', 'missense', 'synonymous', 'other']

const VariantFilterControls = ({
  datasetId,
  consequenceCategoryLabels,
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
}: VariantFilterControlProps) => {

  const gp2Checkboxes = [
    { key: 'pd', label: 'PD' },
    { key: 'psp', label: 'PSP' },
    { key: 'dlb', label: 'DLB' },
    { key: 'msa', label: 'MSA' },
  ];

  return (
    <SettingsWrapper>
      <FiltersWrapper>
        <FiltersFirstColumn>
          <CategoryFilterControl
            categories={lofCategories.map((category) => ({
              id: category,
              label: consequenceCategoryLabels[category],
              className: 'category',
              color: consequenceCategoryColors[category],
            }))}
            categorySelections={filter.includeCategories}
            id="variant-consequence-category-filter"
            onChange={(includeCategories: Record<ConsequenceCategory, boolean>) => {
              onChangeFilter({ ...filter, includeCategories })
            }}
          />
          {(Object.keys(keyboardShortcuts) as ConsequenceCategory[]).map((category) => (
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
                <Select
                  id="analysis-group"
                  value={selectedAnalysisGroup}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChangeAnalysisGroup(e.target.value)}
                  style={{ paddingRight: '10em' }}
                >
                  {variantAnalysisGroupOptions.map((group) => (
                    <option key={group} value={group}>
                      {variantAnalysisGroupLabels[group] || group}
                    </option>
                  ))}
                </Select>
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
              onChange={(customFilter: any) => {
                onChangeFilter({ ...filter, custom: customFilter })
              }}
            />
          )}

          {datasetId === 'GP2' && filter.gp2VariantColumnGroups && (
            <div style={{ marginTop: CustomFilterComponent ? '1em' : '0' }}>
              <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5em' }}>
                GP2 Case groups included in table columns
              </span>
              <div style={{ display: 'flex', gap: '1em' }}>
                {gp2Checkboxes.map(({ key, label }) => (
                  <Checkbox
                    key={key}
                    id={`gp2-group-checkbox-${key}`}
                    label={label}
                    checked={filter.gp2VariantColumnGroups![key]}
                    onChange={(isChecked: boolean) => {
                      onChangeFilter({
                        ...filter,
                        gp2VariantColumnGroups: {
                          ...filter.gp2VariantColumnGroups,
                          [key]: isChecked,
                        },
                      })
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </FiltersSecondColumn>
      </FiltersWrapper>

      <SearchWrapper>
        <SearchInput
          placeholder="Search variant table"
          value={filter.searchText}
          onChange={(searchText: string) => {
            onChangeFilter({ ...filter, searchText })
          }}
        />
      </SearchWrapper>
    </SettingsWrapper>
  )
}

export default VariantFilterControls
