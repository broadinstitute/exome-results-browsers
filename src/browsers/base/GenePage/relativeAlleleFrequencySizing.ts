// @ts-expect-error: no types for d3-scale
import { scaleLog } from 'd3-scale'

// TK: update in GBTK? To allow rending off another piece of data/size?
// hacky, use the same scale as GBTK's lollipop plot
export const TRACK_LIBRARY_RADIUS_SCALE = scaleLog().domain([0.00001, 0.001]).range([4, 12])

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

// use the scale from GBTK to linearly scale given values, rather
//    than log scale based of AF
export const alleleFreqForRelativeRadius = (fraction: number): number =>
  TRACK_LIBRARY_RADIUS_SCALE.invert(4 + 8 * clamp(fraction, 0, 1))
