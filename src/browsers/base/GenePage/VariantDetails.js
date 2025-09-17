import { get } from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable, ExternalLink, ListItem } from '@gnomad/ui'

import { VariantAttribute, VariantAttributeList } from './VariantAttributes'
import { renderExponentialIfSmall } from './variantTableColumns'

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

const CSQ_CODING_HIGH_IMPACT = [
  'transcript_ablation',
  'splice_acceptor_variant',
  'splice_donor_variant',
  'stop_gained',
  'frameshift_variant',
  'stop_lost',
]

const CSQ_CODING_MEDIUM_IMPACT = [
  'start_lost',
  'initiator_codon_variant',
  'transcript_amplification',
  'inframe_insertion',
  'inframe_deletion',
  'missense_variant',
  'protein_altering_variant',
]

const CSQ_CODING_LOW_IMPACT = [
  'splice_donor_5th_base_variant',
  'splice_region_variant',
  'splice_donor_region_variant',
  'splice_polypyrimidine_tract_variant',
  'incomplete_terminal_codon_variant',
  'start_retained_variant',
  'stop_retained_variant',
  'synonymous_variant',
  'coding_sequence_variant',
  'coding_transcript_variant',
]

const CSQ_NON_CODING = [
  'mature_miRNA_variant',
  '5_prime_UTR_variant',
  '3_prime_UTR_variant',
  'non_coding_transcript_exon_variant',
  'non_coding_exon_variant',
  'intron_variant',
  'NMD_transcript_variant',
  'non_coding_transcript_variant',
  'nc_transcript_variant',
  'upstream_gene_variant',
  'downstream_gene_variant',
  'TFBS_ablation',
  'TFBS_amplification',
  'TF_binding_site_variant',
  'regulatory_region_ablation',
  'regulatory_region_amplification',
  'feature_elongation',
  'regulatory_region_variant',
  'feature_truncation',
  'intergenic_variant',
  'sequence_variant',
]

const CSQ_ORDER = [
  ...CSQ_CODING_HIGH_IMPACT,
  ...CSQ_CODING_MEDIUM_IMPACT,
  ...CSQ_CODING_LOW_IMPACT,
  ...CSQ_NON_CODING,
]

const findMostSevereConsequence = (consequences) => {
  return consequences.reduce((mostSevere, current) => {
    const currentIndex = CSQ_ORDER.indexOf(current)
    const mostSevereIndex = CSQ_ORDER.indexOf(mostSevere)
    return currentIndex < mostSevereIndex ? current : mostSevere
  })
}

const parseTranscriptConsequences = (transcriptConsequences) => {
  const reshaped = transcriptConsequences.map((tc) => ({
    geneId: tc.gene_id,
    geneSymbol: tc.gene_symbol,
    transcriptId: tc.transcript_id,
    isCanonical: tc.canonical === 1,
    isManeSelect: tc.mane_select === 1,
    hgvsp: tc.hgvsp && tc.hgvsp.indexOf(':') !== -1 ? tc.hgvsp.split(':')[1] : tc.hgvsp,
    hgvsc: tc.hgvsc && tc.hgvsc.indexOf(':') !== -1 ? tc.hgvsc.split(':')[1] : tc.hgvsc,
    hgncID: tc.hgnc_id,
    domains: tc.domains,
    majorConsequence: findMostSevereConsequence(tc.consequence_terms),
    siftPrediction: tc.sift_prediction,
    polyphenPrediction: tc.polyphen_prediction,
  }))

  const groupedByConsequence = reshaped.reduce((acc, transcript) => {
    const consequence = transcript.majorConsequence

    if (!acc[consequence]) {
      acc[consequence] = {
        consequence,
        genes: {},
      }
    }

    const geneKey = `${transcript.geneId}-${transcript.geneSymbol}`

    if (!acc[consequence].genes[geneKey]) {
      acc[consequence].genes[geneKey] = {
        geneId: transcript.geneId,
        geneSymbol: transcript.geneSymbol ? transcript.geneSymbol : transcript.geneId,
        transcripts: [],
      }
    }

    const { geneId, geneSymbol, consequence: _, ...transcriptData } = transcript
    acc[consequence].genes[geneKey].transcripts.push(transcriptData)

    return acc
  }, {})

  const result = Object.values(groupedByConsequence)
    .map((consequenceGroup) => ({
      consequence: consequenceGroup.consequence,
      genes: Object.values(consequenceGroup.genes),
    }))
    .sort((a, b) => CSQ_ORDER.indexOf(a.consequence) - CSQ_ORDER.indexOf(b.consequence))

  return result
}

const TranscriptConsequencesWrapper = styled.div`
  margin-top: 2em;
`

const ConsequenceListWrapper = styled.ol`
  display: flex;
  flex-flow: row wrap;
  padding: 0;
  list-style-type: none;
  margin-bottom: 1em;

  h3,
  h4 {
    margin: 0 0 0.5em;
  }
`

const ConsequenceListItem = styled.li`
  margin-right: 2em;
`

const GeneList = styled.ol`
  margin-bottom: 1em;
`

const TranscriptList = styled.ol`
  margin-bottom: 1em;
`

const TranscriptDetails = ({ transcript }) => {
  return (
    <ListItem>
      <div>
        {
          <ExternalLink
            href={`https://gnomad.broadinstitute.org/transcript/${transcript.transcriptId}`}
          >
            {transcript.transcriptId}
          </ExternalLink>
        }
        {transcript.isManeSelect && <div>Mane Select transcript</div>}
        {transcript.isCanonical && <div>Canonical transcript</div>}
        {transcript.hgvsp && <div>{`HGVSp: ${transcript.hgvsp}`}</div>}
        {transcript.hgvsc && <div>{`HGVSc: ${transcript.hgvsc}`}</div>}
      </div>
    </ListItem>
  )
}

TranscriptDetails.propTypes = {
  transcript: PropTypes.shape({
    transcriptId: PropTypes.string.isRequired,
    isManeSelect: PropTypes.bool.isRequired,
    isCanonical: PropTypes.bool.isRequired,
    hgvsp: PropTypes.string.isRequired,
    hgvsc: PropTypes.string.isRequired,
  }).isRequired,
}

const TranscriptConsequences = ({ transcriptConsequencesString }) => {
  const transcriptConsequences = JSON.parse(transcriptConsequencesString).filter((tc) =>
    tc.gene_id.startsWith('ENSG')
  )
  const numTranscripts = transcriptConsequences.length
  const numGenes = Array.from(new Set(transcriptConsequences.map((csq) => csq.gene_id))).length

  const parsedTranscriptConsequences = parseTranscriptConsequences(transcriptConsequences)

  return (
    <TranscriptConsequencesWrapper>
      <h2>Transcript Consequences</h2>
      <p>
        This variant falls on {numTranscripts} transcript{numTranscripts !== 1 && 's'} in {numGenes}{' '}
        gene{numGenes !== 1 && 's'}.
      </p>
      <br />

      <ConsequenceListWrapper>
        {parsedTranscriptConsequences.map((consequence) => {
          return (
            <ConsequenceListItem key={consequence.consequence}>
              <h4>{consequence.consequence}</h4>
              <GeneList>
                {consequence.genes.map((gene) => {
                  return (
                    <ListItem key={gene.geneId}>
                      <h4>
                        <ExternalLink
                          href={`https://gnomad.broadinstitute.org/gene/${gene.geneId}`}
                        >
                          {gene.geneSymbol}
                        </ExternalLink>
                      </h4>
                      <TranscriptList>
                        {gene.transcripts
                          .sort((transcript) => (transcript.isManeSelect ? 0 : 1))
                          .map((transcript) => (
                            <TranscriptDetails transcript={transcript} />
                          ))}
                      </TranscriptList>
                    </ListItem>
                  )
                })}
              </GeneList>
            </ConsequenceListItem>
          )
        })}
      </ConsequenceListWrapper>
    </TranscriptConsequencesWrapper>
  )
}

TranscriptConsequences.propTypes = {
  transcriptConsequencesString: PropTypes.string.isRequired,
}

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
  additionalVariantDetailSummaryColumns,
  variantDetailColumns,
  renderVariantTranscriptConsequences,
}) => {
  const { datasetId } = window.datasetConfig

  const defaultGroupResult = inputVariant.group_results[defaultVariantAnalysisGroup]
  // Select default analysis group so that column render methods work correctly
  const variant = { ...inputVariant, group_result: defaultGroupResult }

  const gnomadDataset = referenceGenome === 'GRCh38' ? 'gnomad_r4' : 'gnomad_r2_1'

  const renderedVariantSummaryRows = [
    ...variantResultColumns,
    ...(additionalVariantDetailSummaryColumns || []),
  ]

  const standardColumns = [
    { key: 'group_result.ac_case', heading: 'AC Case', render: (value) => value },
    { key: 'group_result.an_case', heading: 'AN Case', render: (value) => value },
    { key: 'group_result.ac_ctrl', heading: 'AC Ctrl', render: (value) => value },
    { key: 'group_result.an_ctrl', heading: 'AN Ctrl', render: (value) => value },
    {
      key: 'group_result.af_case',
      heading: 'AF Case',
      render: (value) => renderExponential(value),
    },
    {
      key: 'group_result.af_ctrl',
      heading: 'AF Ctrl',
      render: (value) => renderExponential(value),
    },
  ]

  const gp2Columns = [
    {
      key: 'group_result.wgs_ac_case',
      heading: 'WGS AC Case',
      render: (value) => value,
    },
    {
      key: 'group_result.wgs_an_case',
      heading: 'WGS AN Case',
      render: (value) => value,
    },
    {
      key: 'group_result.wgs_af_case',
      heading: 'WGS AF Case',
      render: renderExponentialIfSmall,
    },

    {
      key: 'group_result.wgs_ac_ctrl',
      heading: 'WGS AC Control',
      render: (value) => value,
    },
    {
      key: 'group_result.wgs_an_ctrl',
      heading: 'WGS AN Control',
      render: (value) => value,
    },
    {
      key: 'group_result.wgs_af_ctrl',
      heading: 'WGS AF Control',
      render: renderExponentialIfSmall,
    },

    {
      key: 'group_result.wgs_ac_other',
      heading: 'WGS AC Other',
      render: (value) => value,
    },
    {
      key: 'group_result.wgs_an_other',
      heading: 'WGS AN Other',
      render: (value) => value,
    },
    {
      key: 'group_result.wgs_af_other',
      heading: 'WGS AF Other',
      render: renderExponentialIfSmall,
    },
  ]

  const datasetColumns = datasetId === 'GP2' ? gp2Columns : standardColumns

  const renderedVariantColumns = variantDetailColumns || [
    ...datasetColumns,
    ...variantResultColumns,
  ]

  return (
    <VariantContainer>
      <ExternalLink
        href={`https://gnomad.broadinstitute.org/variant/${variant.variant_id}?dataset=${gnomadDataset}`}
      >
        View in gnomAD
      </ExternalLink>
      <Columns>
        {datasetId !== 'GP2' && defaultGroupResult && (
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
              {renderedVariantSummaryRows.map((c) => (
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
            {renderedVariantColumns.map((c) => (
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
                  {renderedVariantColumns.map((c) => (
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

      {renderVariantTranscriptConsequences && variant.info && variant.info.transcript_consequences && (
        <>
          <TranscriptConsequences
            transcriptConsequencesString={variant.info.transcript_consequences}
          />
        </>
      )}
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
  additionalVariantDetailSummaryColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      heading: PropTypes.string,
      minWidth: PropTypes.number,
      tooltip: PropTypes.string,
      render: PropTypes.func,
      renderForCSV: PropTypes.func,
      showOnGenePage: PropTypes.bool,
      showOnDetails: PropTypes.bool,
    })
  ),
  variantDetailColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      heading: PropTypes.string,
      minWidth: PropTypes.number,
      tooltip: PropTypes.string,
      render: PropTypes.func,
      renderForCSV: PropTypes.func,
      showOnGenePage: PropTypes.bool,
      showOnDetails: PropTypes.bool,
    })
  ),
  renderVariantTranscriptConsequences: PropTypes.bool,
}

VariantDetails.defaultProps = {
  renderVariantAttributes: undefined,
  variantDetailColumns: undefined,
  additionalVariantDetailSummaryColumns: undefined,
  renderVariantTranscriptConsequences: false,
}

export default VariantDetails
