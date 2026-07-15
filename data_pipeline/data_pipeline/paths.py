import os

from data_pipeline.config import pipeline_config


def gene_models_path(output_root):
    output_date = pipeline_config.get("reference_data", "output_last_updated")
    return os.path.join(output_root, "gene_models", output_date, "gene_models.ht")


def combined_dataset_path(output_root):
    combined_output_date = pipeline_config.get("output", "output_last_updated")
    return os.path.join(output_root, "combined", combined_output_date, "combined.ht")


def dataset_output_dir(output_root, dataset_id, downloads=False):
    update_date = pipeline_config.get(dataset_id, "output_last_updated")

    if downloads:
        # Downloads for all datasets share one dated directory; files within it are
        # distinguished by a "{dataset_id}_..." filename prefix rather than a subdirectory
        # (see downloads_file_prefix), unlike the prepared-output layout below.
        return os.path.join(output_root, update_date)

    return os.path.join(output_root, dataset_id.lower(), update_date)


def dataset_gene_results_path(output_root, dataset_id):
    return os.path.join(dataset_output_dir(output_root, dataset_id), "gene_results.ht")


def dataset_variant_results_path(output_root, dataset_id):
    return os.path.join(dataset_output_dir(output_root, dataset_id), "variant_results.ht")


def gp2_combined_variant_results_path(output_root, dataset_id):
    return os.path.join(dataset_output_dir(output_root, dataset_id), "combined_variant_results.ht")


def gp2_combined_variant_annotations_path(output_root, dataset_id):
    return os.path.join(dataset_output_dir(output_root, dataset_id), "combined_variant_annotations.ht")


def downloads_file_prefix(downloads_output_root, dataset_id):
    return os.path.join(dataset_output_dir(downloads_output_root, dataset_id, downloads=True), dataset_id)


def dataset_gene_results_tsv_path(downloads_output_root, dataset_id):
    return f"{downloads_file_prefix(downloads_output_root, dataset_id)}_gene_results.tsv.bgz"


def dataset_variant_results_tsv_path(downloads_output_root, dataset_id):
    return f"{downloads_file_prefix(downloads_output_root, dataset_id)}_variant_results.tsv.bgz"


def dataset_variant_results_vcf_path(downloads_output_root, dataset_id):
    return f"{downloads_file_prefix(downloads_output_root, dataset_id)}_variant_results.vcf.bgz"
