import { Factory } from 'fishery'

import { SchemaVariantGroupResult, SchemaVariantInfo, SchemaVariantRow } from './schemaVariantTypes'

export const schemaVariantInfoFactory = Factory.define<SchemaVariantInfo>(() => ({
  misrank_percentile: 0.5,
  mpc: 1.5,
  alpha_missense: 0.5,
  misfit_s: 0.1,
  pop_eve: 0.5,
}))

export const schemaVariantGroupResultFactory = Factory.define<SchemaVariantGroupResult>(() => ({
  ac_case: 3,
  an_case: 20000,
  af_case: 0.00015,
  ac_ctrl: 1,
  an_ctrl: 40000,
  af_ctrl: 0.000025,
  af: 0.0000667,
  n_de_novo: 1,
  in_analysis: true,
}))

export const schemaVariantRowFactory = Factory.define<SchemaVariantRow>(() => {
  const groupResult = schemaVariantGroupResultFactory.build()

  return {
    variant_id: '16-30984070-G-A',
    pos: 30984070,
    consequence: 'missense_variant',
    consequenceCategory: 'missense',
    hgvsc: 'c.123G>A',
    hgvsp: 'p.Val41Ile',
    hgvs: 'p.Val41Ile',
    info: schemaVariantInfoFactory.build(),
    group_results: { meta: groupResult },
    group_result: groupResult,
  }
})
