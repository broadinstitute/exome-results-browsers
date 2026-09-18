import { VariantLollipopTrackGroup } from '../Browser'
import { lollipopTrackVariants, maxAcAcrossGroupTracks } from './VariantsInGene'
import { VariantRow } from './variantTableColumns'

describe('maxAcAcrossGroupTracks', () => {
  const group: VariantLollipopTrackGroup = {
    key: 'deNovo',
    label: 'De novo',
    tracks: [
      { key: 'proband', title: 'Proband', acField: 'group_result.ac_proband' },
      { key: 'sibling', title: 'Sibling', acField: 'group_result.ac_sibling' },
    ],
  }

  it('is the max AC across both tracks in the group, not each track independently', () => {
    const variants = ([
      { group_result: { ac_proband: 2, ac_sibling: 9 } },
      { group_result: { ac_proband: 5, ac_sibling: 1 } },
    ] as unknown) as VariantRow[]

    expect(maxAcAcrossGroupTracks(variants, group)).toBe(9)
  })

  it('is 0 when every variant has AC 0 on both tracks', () => {
    const variants = ([
      { group_result: { ac_proband: 0, ac_sibling: 0 } },
    ] as unknown) as VariantRow[]

    expect(maxAcAcrossGroupTracks(variants, group)).toBe(0)
  })
})

describe('lollipopTrackVariants', () => {
  const track = { key: 'proband', title: 'Proband', acField: 'group_result.ac_proband' }

  it('drops variants with AC 0 on this track instead of sizing them at the minimum radius', () => {
    const variants = ([
      { variant_id: 'a', group_result: { ac_proband: 0 } },
      { variant_id: 'b', group_result: { ac_proband: 4 } },
    ] as unknown) as VariantRow[]

    const result = lollipopTrackVariants(variants, track, 4)

    expect(result.map((v) => v.variant_id)).toEqual(['b'])
  })

  it('sizes a variant relative to the group max passed in, not this track alone', () => {
    const variants = ([
      { variant_id: 'a', group_result: { ac_proband: 2 } },
    ] as unknown) as VariantRow[]

    const sizedAgainstLargerGroupMax = lollipopTrackVariants(variants, track, 4)[0].allele_freq
    const sizedAgainstSmallerGroupMax = lollipopTrackVariants(variants, track, 2)[0].allele_freq

    // Same AC, larger group max -> smaller fraction -> smaller synthetic
    // allele_freq (VariantPlot's scale is monotonically increasing).
    expect(sizedAgainstLargerGroupMax).toBeLessThan(sizedAgainstSmallerGroupMax)
  })
})
