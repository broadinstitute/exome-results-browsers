import { ConsequenceCategory } from '../base/Browser'
import { EncodedFloat } from '../base/tableCells'

// Manual types constructed from info gotten from running pipeline.
// TK: generate this from pipeline run, possibly from metadata file written out?

// TK: conservatively using `EncodedFloat`, as we haven't inspected which fields
//     actually go non-finite. So defensively assume that all could.
export interface SchemaVariantInfo {
  misrank_percentile: EncodedFloat
  mpc: EncodedFloat
  alpha_missense: EncodedFloat
  misfit_s: EncodedFloat
  pop_eve: EncodedFloat
}

export interface SchemaVariantGroupResult {
  ac_case: number
  an_case: number
  af_case: number
  ac_ctrl: number
  an_ctrl: number
  af_ctrl: number
  af: number
  n_de_novo: number
  in_analysis: boolean
}

export interface SchemaVariantRow {
  variant_id: string
  pos: number
  consequence: string
  consequenceCategory: ConsequenceCategory
  hgvsc: string
  hgvsp: string
  hgvs: string
  info: SchemaVariantInfo
  // keyed as string to avoid circular import
  group_results: Record<string, SchemaVariantGroupResult>
  // The currently-selected analysis group's result, added at runtime by
  // VariantsInGene.tsx's selectGroupResult. This is what SCHEMA's columns key off.
  group_result: SchemaVariantGroupResult
}
