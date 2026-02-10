import React from 'react'
import { SizeMe } from 'react-sizeme'
import styled from 'styled-components'

// @ts-expect-error
import { RegionViewer } from '@gnomad/region-viewer'

const Wrapper = styled.div`
  width: 100%;
`

// TK: TODO: fixme: 'any' to be removed when toolkit version is bumped
const AutosizedRegionViewer = (props: any) => (
  <SizeMe>
    {({ size }) => (
      <Wrapper>
        {size.width && (
          <RegionViewer
            {...props}
            leftPanelWidth={100}
            rightPanelWidth={size.width < 900 ? 0 : 100}
            width={size.width}
          />
        )}
      </Wrapper>
    )}
  </SizeMe>
)

export default AutosizedRegionViewer
