import argparse
import importlib
import os
import sys

import hail as hl
import hailtop.fs as hfs

from data_pipeline.config import get_output_root, pipeline_config
from data_pipeline.validation import validate_gene_results_table, validate_variant_results_table


def prepare_dataset(dataset_id, test_genes, output_root):
    update_date = pipeline_config.get(dataset_id, "output_last_updated")
    output_path = f"{output_root}/{dataset_id.lower()}/{update_date}"

    if dataset_id.lower() == "gp2":
        print("running for GP2")

        combined_variant_results_path = os.path.join(output_path, "combined_variant_results.ht")
        combined_variant_annotations_path = os.path.join(output_path, "combined_variant_annotations.ht")

        compute_combine = not (
            hfs.exists(combined_variant_results_path) and hfs.exists(combined_variant_annotations_path)
        )

        if compute_combine:
            print("Combined GP2 tables do not exist, creating them ...")
            ces_variant_results_path = pipeline_config.get(dataset_id, "ces_variant_results_path")
            ces_variant_results_ht = hl.read_table(ces_variant_results_path)

            wgs_variant_results_path = pipeline_config.get(dataset_id, "wgs_variant_results_path")
            wgs_variant_results_ht = hl.read_table(wgs_variant_results_path)

            ces_variant_annotations_path = pipeline_config.get(dataset_id, "ces_variant_annotations_path")
            ces_variant_annotations_ht = hl.read_table(ces_variant_annotations_path)

            wgs_variant_annotations_path = pipeline_config.get(dataset_id, "wgs_variant_annotations_path")
            wgs_variant_annotations_ht = hl.read_table(wgs_variant_annotations_path)

            combine_data_module = importlib.import_module(
                f"data_pipeline.datasets.{dataset_id.lower()}.{dataset_id.lower()}_combine_input_datasets"
            )

            combined_variant_results_ht, combined_variant_annotations_ht = combine_data_module.combine_input_data(
                ces_variant_results_ht,
                wgs_variant_results_ht,
                ces_variant_annotations_ht,
                wgs_variant_annotations_ht,
                test_genes,
            )

            combined_variant_results_ht.write(combined_variant_results_path, overwrite=True)
            print("Wrote GP2 combined variant results table")
            combined_variant_annotations_ht.write(combined_variant_annotations_path, overwrite=True)
            print("Wrote GP2 combined variant annotations table")

        # ---

        combined_variant_results_ht = hl.read_table(combined_variant_results_path)
        combined_variant_annotations_ht = hl.read_table(combined_variant_annotations_path)

        print(f"\n\n === Preparing {dataset_id} variants hail table")
        variant_results_module = importlib.import_module(
            f"data_pipeline.datasets.{dataset_id.lower()}.{dataset_id.lower()}_variant_results"
        )
        variant_results = variant_results_module.prepare_variant_results(
            combined_variant_results_ht, combined_variant_annotations_ht, test_genes, output_root
        )
        validate_variant_results_table(variant_results)
        variant_results.write(os.path.join(output_path, "variant_results.ht"), overwrite=True)

        print(f"\n\n === Preparing {dataset_id} genes hail table")
        gene_results_module = importlib.import_module(
            f"data_pipeline.datasets.{dataset_id.lower()}.{dataset_id.lower()}_gene_results"
        )
        gene_results = gene_results_module.prepare_gene_results(test_genes, output_root)
        validate_gene_results_table(gene_results)
        gene_results.write(os.path.join(output_path, "gene_results.ht"), overwrite=True)

    elif dataset_id.lower() == "ClinVarGRCh38".lower():
        print(f"\n\n === Preparing {dataset_id} variants hail table")
        clinvar_grch38_module = importlib.import_module("data_pipeline.datasets.clinvar.clinvar_grch38")

        ht_clinvar_variants = clinvar_grch38_module.prepare_clinvar_variants(test_genes)
        ht_clinvar_variants.write(os.path.join(output_path, "variant_results.ht"), overwrite=True)

        clinvar_grch38_dummy_genes_module = importlib.import_module(
            "data_pipeline.datasets.clinvar.clinvar_grch38_dummy_genes"
        )
        ht_clinvar_genes = clinvar_grch38_dummy_genes_module.prepare_gene_results(test_genes, output_root)
        ht_clinvar_genes.write(os.path.join(output_path, "gene_results.ht"), overwrite=True)

    else:
        print(f"\n\n === Preparing {dataset_id} variants hail table")
        variant_results_module = importlib.import_module(
            f"data_pipeline.datasets.{dataset_id.lower()}.{dataset_id.lower()}_variant_results"
        )
        variant_results = variant_results_module.prepare_variant_results(test_genes, output_root)
        validate_variant_results_table(variant_results)
        variant_results.write(os.path.join(output_path, "variant_results.ht"), overwrite=True)

        print(f"\n\n === Preparing {dataset_id} genes hail table")
        gene_results_module = importlib.import_module(
            f"data_pipeline.datasets.{dataset_id.lower()}.{dataset_id.lower()}_gene_results"
        )
        gene_results = gene_results_module.prepare_gene_results(test_genes, output_root)
        validate_gene_results_table(gene_results)
        gene_results.write(os.path.join(output_path, "gene_results.ht"), overwrite=True)


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
        "--test-genes",
        action="store_true",
        help="Only process a few genes to test the pipelines quickly",
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

    print(f"\nPreparing datasets: {list(datasets_to_prepare)} ...\n\n")

    # hl.init()
    hl.init(
        spark_conf={
            "spark.driver.bindAddress": "127.0.0.1",
            "spark.driver.host": "127.0.0.1",
        },
    )

    output_root = get_output_root(args.output_local)
    for dataset in datasets_to_prepare:
        prepare_dataset(dataset, args.test_genes, output_root)


if __name__ == "__main__":
    sys.exit(main())
