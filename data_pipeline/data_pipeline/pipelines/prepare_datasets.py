import argparse
import importlib
import os
import sys

import hail as hl

from data_pipeline.config import pipeline_config
from data_pipeline.validation import validate_gene_results_table, validate_variant_results_table


def prepare_dataset(dataset_id):
    output_path = pipeline_config.get("output", "staging_path")

    # gene_results_module = importlib.import_module(
    #     f"data_pipeline.datasets.{dataset_id.lower()}.{dataset_id.lower()}_gene_results"
    # )
    variant_results_module = importlib.import_module(
        f"data_pipeline.datasets.{dataset_id.lower()}.{dataset_id.lower()}_variant_results"
    )

    # gene_results = gene_results_module.prepare_gene_results()
    # validate_gene_results_table(gene_results)
    # gene_results.write(os.path.join(output_path, dataset_id.lower(), "gene_results.ht"), overwrite=True)

    variant_results = variant_results_module.prepare_variant_results()
    validate_variant_results_table(variant_results)
    variant_results.write(os.path.join(output_path, dataset_id.lower(), "variant_results.ht"), overwrite=True)

    print("exiting!")
    exit(0)


def main():
    all_datasets = pipeline_config.get("datasets", "datasets").split(",")
    parser = argparse.ArgumentParser()
    parser.add_argument("datasets", nargs="*", metavar=f"{{{','.join(all_datasets)}}}")
    args = parser.parse_args()

    if args.datasets:
        for dataset in args.datasets:
            if dataset not in all_datasets:
                print(f"error: invalid dataset '{dataset}' (choose from {', '.join(all_datasets)})", file=sys.stderr)
                return 1

        datasets_to_prepare = args.datasets
    else:
        datasets_to_prepare = all_datasets

    hl.init()

    for dataset in datasets_to_prepare:
        prepare_dataset(dataset)


if __name__ == "__main__":
    sys.exit(main())
