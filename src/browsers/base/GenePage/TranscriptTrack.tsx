import React from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this version of @gnomad/track-regions
import { RegionsTrack } from '@gnomad/track-regions'

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 1em;
`

const LeftPanel = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  padding-right: 10px;
`

const StrandIcon = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: #424242;
  color: #fff;
  font-size: 18px;
  line-height: 20px;
  text-align: center;
`

export type Strand = '+' | '-'

interface TranscriptTrackProps {
  exons: {
    start: number
    stop: number
  }[]
  strand: Strand
}

const TranscriptTrack = ({ exons, strand }: TranscriptTrackProps) => {
  return (
    <Wrapper>
      <RegionsTrack
        height={20}
        regions={exons}
        regionAttributes={() => ({ fill: '#424242' })}
        renderLeftPanel={() => (
          <LeftPanel>
            <StrandIcon>{strand === '-' ? <span>&larr;</span> : <span>&rarr;</span>}</StrandIcon>
          </LeftPanel>
        )}
      />
    </Wrapper>
  )
}

export default TranscriptTrack
