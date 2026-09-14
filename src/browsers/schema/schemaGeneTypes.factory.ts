import { Factory } from 'fishery'

import { SchemaGeneResult, SchemaGeneRow } from './schemaGeneTypes'

export const schemaGeneResultFactory = Factory.define<SchemaGeneResult>(() => ({
  ptv_case_carrier: 3,
  ptv_control_carrier: 1,
  ptv_p_value: 0.01,
  ptv_odds_ratio: '2.5',
  ptv_odds_ratio_95_ci: '1.2-4.1',

  ptv_mis_case_carrier: 5,
  ptv_mis_control_carrier: 2,
  ptv_mis_p_value: 0.02,
  ptv_mis_odds_ratio: '2.1',
  ptv_mis_odds_ratio_95_ci: '1.1-3.8',

  mis_case_carrier: 8,
  mis_control_carrier: 4,
  mis_p_value: 0.03,
  mis_odds_ratio: '1.8',
  mis_odds_ratio_95_ci: '1.0-3.2',

  syn_case_carrier: 6,
  syn_control_carrier: 6,
  syn_p_value: 0.9,
  syn_odds_ratio: '1.0',
  syn_odds_ratio_95_ci: '0.6-1.6',

  ptv_n_de_novo: 2,
  ptv_mis_n_de_novo: 1,

  n_de_novo_p_value: 0.005,
  case_control_plus_de_novo_p_value: 0.001,
  schema_case_control_p_value: 0.01,

  n_cases: 10000,
  n_controls: 20000,
}))

export const schemaGeneRowFactory = Factory.define<SchemaGeneRow>(() => ({
  gene_id: 'ENSG00000181090',
  gene_symbol: 'SETD1A',
  gene_name: 'SET domain containing 1A, histone lysine methyltransferase',
  chrom: '16',
  pos: 30984070,
  ...schemaGeneResultFactory.build(),
}))
