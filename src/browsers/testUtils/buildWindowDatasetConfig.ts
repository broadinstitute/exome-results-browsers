import { DatasetId } from '../base/Browser'

// Production's window.datasetConfig.datasets always includes ClinVarGRCh38
// (GP2's variant pages depend on it), regardless of which dataset is current.
// It's not a DatasetId and never has downloadable files of its own.
const PRODUCTION_WINDOW_DATASETS: (DatasetId | 'ClinVarGRCh38')[] = [
  'ASC',
  'BipEx',
  'Epi25',
  'GP2',
  'IBD',
  'SCHEMA',
  'ClinVarGRCh38',
]

const buildDatasetFields = () => ({
  reference_genome: 'GRCh37' as const,
  gene_result_analysis_groups: [],
  gene_group_result_field_names: [],
  gene_group_result_field_types: [],
  variant_result_analysis_groups: [],
  variant_group_result_field_names: [],
  variant_group_result_field_types: [],
  variant_info_field_names: [],
  variant_info_field_types: [],
})

// Minimally valid window.datasetConfig, covering every field the shared
// Browser.tsx/DownloadsPage.tsx module-level code reads on import — not a
// fixture for any dataset's actual field lists.
export const buildWindowDatasetConfig = (datasetId: DatasetId): Window['datasetConfig'] => ({
  datasetId,
  reference_genome: 'GRCh37',
  datasets: (Object.fromEntries(
    PRODUCTION_WINDOW_DATASETS.map((id) => [id, buildDatasetFields()])
  ) as unknown) as Window['datasetConfig']['datasets'],
  gene_result_analysis_groups: [],
  gene_group_result_field_names: [],
  gene_group_result_field_types: [],
  variant_result_analysis_groups: [],
  variant_fields: [],
  variant_group_result_field_names: [],
  variant_group_result_field_types: [],
  variant_info_field_names: [],
  variant_info_field_types: [],
})
