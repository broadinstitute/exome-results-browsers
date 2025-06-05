import PropTypes from 'prop-types'
import React, { useState } from 'react'
import styled from 'styled-components'

import { ExternalLink, List, ListItem, Modal, TextButton } from '@gnomad/ui'

import datasetConfig from '../../datasetConfig'

const GeneReferences = ({ gene }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const gnomadDataset = gene.reference_genome === 'GRCh37' ? 'gnomad_r2_1' : 'gnomad_r3'
  const gnomadGeneUrl = `https://gnomad.broadinstitute.org/gene/${gene.gene_id}?dataset=${gnomadDataset}`

  const ensemblGeneUrl = `https://${
    gene.reference_genome === 'GRCh37' ? 'grch37.' : ''
  }ensembl.org/Homo_sapiens/Gene/Summary?g=${gene.gene_id}`

  const ucscReferenceGenomeId = gene.reference_genome === 'GRCh37' ? 'hg19' : 'hg38'
  const ucscUrl = `https://genome.ucsc.edu/cgi-bin/hgTracks?db=${ucscReferenceGenomeId}&position=chr${gene.chrom}%3A${gene.start}-${gene.stop}`

  return (
    <>
      <ExternalLink href={gnomadGeneUrl}>gnomAD</ExternalLink>,{' '}
      <ExternalLink href={ensemblGeneUrl}>Ensembl</ExternalLink>,{' '}
      <ExternalLink href={ucscUrl}>UCSC Browser</ExternalLink>,{' '}
      <TextButton
        onClick={() => {
          setIsExpanded(true)
        }}
      >
        and more
      </TextButton>
      {isExpanded && (
        <Modal
          initialFocusOnButton={false}
          onRequestClose={() => {
            setIsExpanded(false)
          }}
          title={`References for ${gene.symbol}`}
        >
          <List>
            <ListItem>
              <ExternalLink href={gnomadGeneUrl}>gnomAD</ExternalLink>
            </ListItem>
            <ListItem>
              <ExternalLink href={ensemblGeneUrl}>Ensembl</ExternalLink>
            </ListItem>
            <ListItem>
              <ExternalLink href={ucscUrl}>UCSC Browser</ExternalLink>
            </ListItem>
            <ListItem>
              <ExternalLink
                href={`https://www.genecards.org/cgi-bin/carddisp.pl?gene=${gene.symbol}`}
              >
                GeneCards
              </ExternalLink>
            </ListItem>
            {gene.omim_id && (
              <ListItem>
                <ExternalLink href={`https://omim.org/entry/${gene.omim_id}`}>OMIM</ExternalLink>
              </ListItem>
            )}
            <ListItem>
              <ExternalLink
                href={`https://decipher.sanger.ac.uk/gene/${gene.gene_id}#overview/protein-info`}
              >
                DECIPHER
              </ExternalLink>
            </ListItem>
            {gene.hgnc_id && (
              <ListItem>
                <ExternalLink href={`https://search.clinicalgenome.org/kb/genes/${gene.hgnc_id}`}>
                  ClinGen
                </ExternalLink>
              </ListItem>
            )}
            {gene.hgnc_id && (
              <ListItem>
                <ExternalLink
                  href={`https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/${gene.hgnc_id}`}
                >
                  HGNC
                </ExternalLink>
              </ListItem>
            )}
          </List>
        </Modal>
      )}
    </>
  )
}

GeneReferences.propTypes = {
  gene: PropTypes.shape({
    reference_genome: PropTypes.oneOf(['GRCh37', 'GRCh38']).isRequired,
    gene_id: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    chrom: PropTypes.string.isRequired,
    start: PropTypes.number.isRequired,
    stop: PropTypes.number.isRequired,
    hgnc_id: PropTypes.string,
    omim_id: PropTypes.string,
  }).isRequired,
}

const DescriptionList = styled.dl`
  dt {
    width: 115px;
    font-weight: bold;
  }

  dd {
    margin-left: 1em;
  }
`

const DescriptionListItem = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 0.5em;
`

const GeneInfo = ({ gene }) => {
  const ucscReferenceGenomeId = gene.reference_genome === 'GRCh38' ? 'hg38' : 'hg19'

  const otherStudies = [{ id: 'ASC' }, { id: 'BipEx' }, { id: 'Epi25' }, { id: 'SCHEMA' }].filter(
    ({ id }) => id !== datasetConfig.datasetId
  )

  return (
    <DescriptionList>
      <DescriptionListItem>
        <dt>Genome build</dt>
        <dd>
          {gene.reference_genome} / {ucscReferenceGenomeId}
        </dd>
      </DescriptionListItem>
      <DescriptionListItem>
        <dt>Ensembl gene ID</dt>
        <dd>{gene.gene_id}</dd>
      </DescriptionListItem>
      <DescriptionListItem>
        <dt>Region</dt>
        <dd>{`Chr${gene.chrom}:${gene.start}-${gene.stop}`}</dd>
      </DescriptionListItem>
      <DescriptionListItem>
        <dt>References</dt>
        <dd>
          <GeneReferences gene={gene} />
        </dd>
      </DescriptionListItem>
      <DescriptionListItem>
        <dt>Other studies</dt>
        <dd>
          {otherStudies
            .map(({ id }) => (
              <ExternalLink
                key={id}
                href={`https://${id.toLowerCase()}.broadinstitute.org/gene/${gene.gene_id}`}
              >
                {id}
              </ExternalLink>
            ))
            .reduce((acc, link) => [...acc, ', ', link], [])
            .slice(1)}
        </dd>
      </DescriptionListItem>
    </DescriptionList>
  )
}
GeneInfo.propTypes = {
  gene: PropTypes.shape({
    reference_genome: PropTypes.oneOf(['GRCh37', 'GRCh38']),
    gene_id: PropTypes.string.isRequired,
    chrom: PropTypes.string.isRequired,
    start: PropTypes.number.isRequired,
    stop: PropTypes.number.isRequired,
  }).isRequired,
}

export default GeneInfo
