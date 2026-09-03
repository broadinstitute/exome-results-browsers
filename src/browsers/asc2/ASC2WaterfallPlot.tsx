import React from 'react'
import styled from 'styled-components'

import WaterfallPlotImage from './content/waterfall_plot.png'

const Wrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
`

const Image = styled.img`
  display: block;
  width: 100%;
`

const Caption = styled.p`
  font-size: 14px;
  line-height: 150%;
  color: #555;
`

const ASC2WaterfallPlot = () => (
  <Wrapper>
    <Image src={WaterfallPlotImage} alt="TADA waterfall plot" />
    <Caption>
      <strong>TADA waterfall plot.</strong> 253 autism-associated genes identified by TADA (FDR &lt;
      0.001), ordered by strength of association. For each gene, the amount of evidence (x-axis) is
      shown as log
      <sub>10</sub>(Bayes Factor) per variant class (left) and inheritance mode (right). The figure
      is split into four panels with different x-axes. *indicates genes identified (FDR &lt; 0.001)
      in our previous study (Fu et al., 2022).
    </Caption>
  </Wrapper>
)

export default ASC2WaterfallPlot
