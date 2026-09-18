import { readFileSync } from 'fs'
import { join } from 'path'

import {
  TRACK_LIBRARY_RADIUS_SCALE,
  alleleFreqForRelativeRadius,
} from './relativeAlleleFrequencySizing'

describe('alleleFreqForRelativeRadius', () => {
  it('round-trips a fraction of 0 through the library scale to the minimum radius', () => {
    expect(TRACK_LIBRARY_RADIUS_SCALE(alleleFreqForRelativeRadius(0))).toBeCloseTo(4)
  })

  it('round-trips a fraction of 1 through the library scale to the maximum radius', () => {
    expect(TRACK_LIBRARY_RADIUS_SCALE(alleleFreqForRelativeRadius(1))).toBeCloseTo(12)
  })

  it('round-trips a fraction of 0.5 through the library scale to the midpoint radius', () => {
    expect(TRACK_LIBRARY_RADIUS_SCALE(alleleFreqForRelativeRadius(0.5))).toBeCloseTo(8)
  })

  it('scales linearly in fraction, not logarithmically', () => {
    const radii = [0, 0.25, 0.5, 0.75, 1].map((fraction) =>
      TRACK_LIBRARY_RADIUS_SCALE(alleleFreqForRelativeRadius(fraction))
    )

    expect(radii).toEqual([4, 6, 8, 10, 12].map((radius) => expect.closeTo(radius)))
  })

  it('clamps fractions below 0 to the minimum radius', () => {
    expect(TRACK_LIBRARY_RADIUS_SCALE(alleleFreqForRelativeRadius(-1))).toBeCloseTo(4)
  })

  it('clamps fractions above 1 to the maximum radius', () => {
    expect(TRACK_LIBRARY_RADIUS_SCALE(alleleFreqForRelativeRadius(2))).toBeCloseTo(12)
  })
})

describe('@gnomad/track-variants version pin', () => {
  it('stays on the version whose VariantPlot scale this file mirrors', () => {
    const packageJsonPath = join(
      __dirname,
      '../../../../node_modules/@gnomad/track-variants/package.json'
    )
    const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    expect(version).toBe('1.0.0')
  })
})
