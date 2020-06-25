import { get } from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable, ExternalLink } from '@gnomad/ui'

import { VariantAttribute, VariantAttributeList } from './VariantAttributes'

const VariantContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 300px;
`

const Column = styled.div``

const Columns = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  margin: 1em 0;

  ${Column} {
    flex-basis: calc(50% - 1em);
  }

  @media (max-width: 600px) {
    ${Column} {
      flex-basis: 100%;
    }
  }
`

const renderNumber = (num, precision = 3) =>
  num === null ? '–' : Number(num.toPrecision(precision)).toString()

const renderExponential = (num, precision = 4) =>
  num === null ? '–' : Number(num.toPrecision(precision)).toExponential()

const VariantDetails = ({
  defaultVariantAnalysisGroup,
  referenceGenome,
  variant: inputVariant,
  variantAnalysisGroupLabels,
  variantResultColumns,
  renderVariantAttributes,
}) => {
  const defaultGroupResult = inputVariant.group_results[defaultVariantAnalysisGroup]
  // Select default analysis group so that column render methods work correctly
  const variant = { ...inputVariant, group_result: defaultGroupResult }

  const gnomadDataset = referenceGenome === 'GRCh38' ? 'gnomad_r3' : 'gnomad_r2_1'

  return (
    <VariantContainer>
      <ExternalLink
        href={`https://gnomad.broadinstitute.org/variant/${variant.variant_id}?dataset=${gnomadDataset}`}
      >
        View in gnomAD
      </ExternalLink>
      <Columns>
        {defaultGroupResult && (
          <Column>
            <VariantAttributeList label={`Analysis (${defaultVariantAnalysisGroup})`}>
              <VariantAttribute label="Cases">
                {defaultGroupResult.ac_case} / {defaultGroupResult.an_case} (
                {renderExponential(defaultGroupResult.af_case, 4)})
              </VariantAttribute>
              <VariantAttribute label="Controls">
                {defaultGroupResult.ac_ctrl} / {defaultGroupResult.an_ctrl} (
                {renderExponential(defaultGroupResult.af_ctrl, 4)})
              </VariantAttribute>
              {variantResultColumns.map((c) => (
                <VariantAttribute key={c.key} label={c.heading}>
                  {get(variant, c.key) === null
                    ? null
                    : (c.render || renderNumber)(get(variant, c.key))}
                </VariantAttribute>
              ))}
            </VariantAttributeList>
          </Column>
        )}

        <Column>
          <VariantAttributeList label="Annotations">
            <VariantAttribute label="HGVSc">{variant.hgvsc}</VariantAttribute>
            <VariantAttribute label="HGVSp">{variant.hgvsp}</VariantAttribute>
            <VariantAttribute label="Consequence">{variant.consequence}</VariantAttribute>
            {renderVariantAttributes &&
              renderVariantAttributes(variant.info).map(({ label, content }) => (
                <VariantAttribute key={label} label={label}>
                  {content}
                </VariantAttribute>
              ))}
          </VariantAttributeList>
        </Column>
      </Columns>

      <h2>Analysis Groups</h2>
      <BaseTable>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">AC Case</th>
            <th scope="col">AN Case</th>
            <th scope="col">AC Ctrl</th>
            <th scope="col">AN Ctrl</th>
            <th scope="col">AF Case</th>
            <th scope="col">AF Ctrl</th>
            {variantResultColumns.map((c) => (
              <th key={c.key} scope="col">
                {c.heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.keys(variant.group_results)
            .sort((g1, g2) => {
              if (g1 === defaultVariantAnalysisGroup) {
                return -1
              }
              if (g2 === defaultVariantAnalysisGroup) {
                return 1
              }
              return (variantAnalysisGroupLabels[g1] || g1).localeCompare(
                variantAnalysisGroupLabels[g2] || g2
              )
            })
            .map((analysisGroup) => {
              const groupResult = variant.group_results[analysisGroup]
              const rowVariant = { ...variant, group_result: groupResult }

              return (
                <tr key={analysisGroup}>
                  <th scope="row">{variantAnalysisGroupLabels[analysisGroup] || analysisGroup}</th>
                  <td>{groupResult.ac_case}</td>
                  <td>{groupResult.an_case}</td>
                  <td>{groupResult.ac_ctrl}</td>
                  <td>{groupResult.an_ctrl}</td>
                  <td>{renderExponential(groupResult.af_case)}</td>
                  <td>{renderExponential(groupResult.af_ctrl)}</td>
                  {variantResultColumns.map((c) => (
                    <td key={c.key}>
                      {get(rowVariant, c.key) === null
                        ? ''
                        : (c.render || renderNumber)(get(rowVariant, c.key))}
                    </td>
                  ))}
                </tr>
              )
            })}
        </tbody>
      </BaseTable>
    </VariantContainer>
  )
}

VariantDetails.propTypes = {
  defaultVariantAnalysisGroup: PropTypes.string.isRequired,
  referenceGenome: PropTypes.oneOf(['GRCh37', 'GRCh38']).isRequired,
  variant: PropTypes.shape({
    variant_id: PropTypes.string.isRequired,
    pos: PropTypes.number.isRequired,
    consequence: PropTypes.string,
    hgvsc: PropTypes.string,
    hgvsp: PropTypes.string,
    info: PropTypes.object,
    group_results: PropTypes.objectOf(PropTypes.object).isRequired,
  }).isRequired,
  variantAnalysisGroupLabels: PropTypes.objectOf(PropTypes.string).isRequired,
  variantResultColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      heading: PropTypes.string,
      minWidth: PropTypes.number,
      tooltip: PropTypes.string,
      render: PropTypes.func,
    })
  ).isRequired,
  renderVariantAttributes: PropTypes.func,
}

VariantDetails.defaultProps = {
  renderVariantAttributes: undefined,
}

export default VariantDetails
