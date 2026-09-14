// Manual types constructed from info gotten from running pipeline.
// TK: generate this from pipeline run, possibly from metadata file written out?

export interface SchemaGeneResult {
  ptv_case_carrier: number
  ptv_control_carrier: number
  ptv_p_value: number
  ptv_odds_ratio: string
  ptv_odds_ratio_95_ci: string

  ptv_mis_case_carrier: number
  ptv_mis_control_carrier: number
  ptv_mis_p_value: number
  ptv_mis_odds_ratio: string
  ptv_mis_odds_ratio_95_ci: string

  mis_case_carrier: number
  mis_control_carrier: number
  mis_p_value: number
  mis_odds_ratio: string
  mis_odds_ratio_95_ci: string

  syn_case_carrier: number
  syn_control_carrier: number
  syn_p_value: number
  syn_odds_ratio: string
  syn_odds_ratio_95_ci: string

  ptv_n_de_novo: number
  ptv_mis_n_de_novo: number

  n_de_novo_p_value: number
  case_control_plus_de_novo_p_value: number
  schema_case_control_p_value: number

  n_cases: number
  n_controls: number
}

// The row shape GeneResultsPage's `results.map` produces: base fields
// flattened with the selected analysis group's SchemaGeneResult spread on
// top. This is what geneResultColumns' accessor/render callbacks receive —
// not the pre-merge, group_results-keyed shape the /results fetch returns.
export interface SchemaGeneRow extends SchemaGeneResult {
  gene_id: string
  gene_symbol: string
  gene_name: string
  chrom: string
  pos: number
}
