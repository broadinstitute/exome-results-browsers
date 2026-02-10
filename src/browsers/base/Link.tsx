import { Link as RRLink } from 'react-router-dom'

// @ts-expect-error: no types in this @gnomad/ui version
import { Link as StyledLink } from '@gnomad/ui'

const StyledRRLink = StyledLink.withComponent(RRLink)

export default StyledRRLink
