import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

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

const TranscriptTrack = ({ exons, strand }) => {
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

TranscriptTrack.propTypes = {
  exons: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.number.isRequired,
      stop: PropTypes.number.isRequired,
    })
  ).isRequired,
  strand: PropTypes.oneOf(['+', '-']).isRequired,
}

export default TranscriptTrack
