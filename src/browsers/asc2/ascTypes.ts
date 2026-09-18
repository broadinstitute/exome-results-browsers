export interface ASC2GeneResult {
  bayes_factor: number
  false_discovery_rate: number
  was_flagged_in_qc: boolean

  de_novo_ptv_proband: number
  de_novo_ptv_sibling: number
  de_novo_mis2_proband: number
  de_novo_mis2_sibling: number
  de_novo_mis1_proband: number
  de_novo_mis1_sibling: number
  de_novo_mis0_proband: number
  de_novo_mis0_sibling: number
  de_novo_syn_proband: number
  de_novo_syn_sibling: number
  de_novo_del_proband: number
  de_novo_del_sibling: number
  de_novo_dup_proband: number
  de_novo_dup_sibling: number

  transmitted_ptv_proband: number
  untransmitted_ptv_proband: number
  transmitted_mis2_proband: number
  untransmitted_mis2_proband: number
  transmitted_mis1_proband: number
  untransmitted_mis1_proband: number
  transmitted_mis0_proband: number
  untransmitted_mis0_proband: number
  transmitted_syn_proband: number
  untransmitted_syn_proband: number
  transmitted_del_proband: number
  untransmitted_del_proband: number
  transmitted_dup_proband: number
  untransmitted_dup_proband: number

  ptv_case: number
  ptv_control: number
  mis2_case: number
  mis2_control: number
  mis1_case: number
  mis1_control: number
  mis0_case: number
  mis0_control: number
  syn_case: number
  syn_control: number
  del_case: number
  del_control: number
  dup_case: number
  dup_control: number
}

export interface ASC2VariantClassCategory {
  suffix: 'ptv' | 'mis2' | 'mis1' | 'mis0' | 'syn' | 'del' | 'dup'
  label: string
  criteria?: string
  tooltip: string
  // Categories reviewed but excluded from the ASC2 analysis, shown de-emphasized in the gene result table.
  isExcludedFromAnalysis?: boolean
}

const MIS2_CRITERIA = '(MPC \u2265 2 and AM \u2265 0.97)'
const MIS1_CRITERIA = '(MPC \u2265 2 or AM \u2265 0.97)'
const MIS0_CRITERIA = '(MPC < 2 and AM < 0.97)'

export const ASC2_VARIANT_CLASS_CATEGORIES: ASC2VariantClassCategory[] = [
  { suffix: 'ptv', label: 'PTV', tooltip: 'Protein-truncating variants.' },
  {
    suffix: 'mis2',
    label: 'Mis2',
    criteria: MIS2_CRITERIA,
    tooltip: `Mis2 variants ${MIS2_CRITERIA}.`,
  },
  {
    suffix: 'mis1',
    label: 'Mis1',
    criteria: MIS1_CRITERIA,
    tooltip: `Mis1 variants ${MIS1_CRITERIA}.`,
  },
  {
    suffix: 'mis0',
    label: 'Mis0',
    criteria: MIS0_CRITERIA,
    tooltip: `Mis0 variants ${MIS0_CRITERIA}. Not used for gene discovery.`,
    isExcludedFromAnalysis: true,
  },
  {
    suffix: 'syn',
    label: 'SYN',
    tooltip: 'Synonymous variants. Not used for gene discovery.',
    isExcludedFromAnalysis: true,
  },
  {
    suffix: 'del',
    label: 'DEL',
    tooltip: 'Qualifying deletions (affecting 1-3 constrained genes).',
  },
  {
    suffix: 'dup',
    label: 'DUP',
    tooltip: 'Qualifying duplications (affecting 1-3 constrained genes).',
  },
]

export const describeVariantClass = (category: ASC2VariantClassCategory): string => {
  switch (category.suffix) {
    case 'mis2':
    case 'mis1':
    case 'mis0':
      return `${category.label} variant ${category.criteria}`
    case 'del':
      return 'deletions'
    case 'dup':
      return 'duplications'
    case 'syn':
      return 'synonymous variants'
    default:
      return `${category.label} variants`
  }
}

export type ASC2VariantClass = 'PTV' | 'Mis2' | 'Mis1' | 'Mis0' | 'synonymous'

export interface ASC2VariantInfo {
  mpc: number | null
  alpha_missense: number | null
  is_other_splice: boolean | null
  gnomad_af: number | null
  transcript_id: string | null
  variant_class: ASC2VariantClass
}

export interface ASC2VariantGroupResult {
  de_novo_ac_proband: number
  de_novo_ac_sibling: number
  transmitted_ac_proband: number
  untransmitted_ac_proband: number
  ac_case: number
  ac_ctrl: number
}

export interface ASC2VariantRow {
  info: ASC2VariantInfo
  group_result: ASC2VariantGroupResult
}
