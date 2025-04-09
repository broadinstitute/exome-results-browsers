import argparse
import importlib
import os
import sys

import hail as hl

from data_pipeline.config import pipeline_config
from data_pipeline.validation import validate_gene_results_table, validate_variant_results_table


def get_output_root(output_local):
    output_location = "local" if output_local else "gcs"
    output_root = pipeline_config.get("output", f"{output_location}_output_root")

    if output_local:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_root = os.path.abspath(os.path.join(script_dir, "..", "..", "..", output_root))

    return output_root


def prepare_dataset(dataset_id, test_gene_symbol, output_local):
    update_date = pipeline_config.get(dataset_id, "output_last_updated")
    output_root = get_output_root(output_local)
    output_path = f"{output_root}/{dataset_id.lower()}/{update_date}"

    gene_results_module = importlib.import_module(
        f"data_pipeline.datasets.{dataset_id.lower()}.{dataset_id.lower()}_gene_results"
    )
    gene_results = gene_results_module.prepare_gene_results(test_gene_symbol)
    validate_gene_results_table(gene_results)
    gene_results.write(os.path.join(output_path, "gene_results.ht"), overwrite=True)

    variant_results_module = importlib.import_module(
        f"data_pipeline.datasets.{dataset_id.lower()}.{dataset_id.lower()}_variant_results"
    )
    variant_results = variant_results_module.prepare_variant_results(test_gene_symbol)
    validate_variant_results_table(variant_results)
    variant_results.write(os.path.join(output_path, "variant_results.ht"), overwrite=True)


def main():
    all_datasets = pipeline_config.get("datasets", "datasets").split(",")
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--datasets",
        nargs="*",
        metavar=f"{{{','.join(all_datasets)}}}",
        required=True,
        help=f"Datasets to process. Either 'all', or a space separated list of {', '.join(all_datasets)}",
    )

    parser.add_argument("--output-local", action="store_true", help="Output files locally instead of to cloud storage")

    parser.add_argument(
        "--test-gene",
        nargs="?",
        const="PCSK9",
        default=None,
    )

    args = parser.parse_args()

    if args.datasets != ["all"]:
        for dataset in args.datasets:
            if dataset not in all_datasets:
                print(f"error: invalid dataset '{dataset}' (choose from {', '.join(all_datasets)})", file=sys.stderr)
                return 1

        datasets_to_prepare = args.datasets
    else:
        datasets_to_prepare = all_datasets

    hl.init()

    for dataset in datasets_to_prepare:
        prepare_dataset(dataset, args.test_gene, args.output_local)


if __name__ == "__main__":
    sys.exit(main())
