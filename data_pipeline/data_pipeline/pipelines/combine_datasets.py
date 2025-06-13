import argparse
import os
import sys

import hail as hl

from data_pipeline.config import pipeline_config


VARIANT_FIELDS = [
    "variant_id",
    "pos",
    "consequence",
    "hgvsc",
    "hgvsp",
    "info",
    "group_results",
]


def combine_datasets(dataset_ids, output_root):
    gene_models_last_updated = pipeline_config.get("reference_data", "output_last_updated")
    gene_models_path = f"{output_root}/gene_models/{gene_models_last_updated}/gene_models.ht"
    ds = hl.read_table(gene_models_path)

    ds = ds.annotate(gene_results=hl.struct(), variants=hl.struct())
    ds = ds.annotate_globals(meta=hl.struct(variant_fields=VARIANT_FIELDS, datasets=hl.struct()))

    for dataset_id in dataset_ids:
        dataset_last_updated = pipeline_config.get(dataset_id, "output_last_updated")
        dataset_path = os.path.join(output_root, dataset_id.lower(), dataset_last_updated)

        gene_results = hl.read_table(os.path.join(dataset_path, "gene_results.ht"))

        gene_group_result_field_names = gene_results.group_results.dtype.value_type.fields
        gene_group_result_field_types = [
            str(typ).rstrip("3264") for typ in gene_results.group_results.dtype.value_type.types
        ]
        gene_result_analysis_groups = list(
            gene_results.aggregate(hl.agg.explode(hl.agg.collect_as_set, gene_results.group_results.keys()))
        )

        gene_results = gene_results.annotate(
            group_results=hl.array(
                [
                    hl.tuple([gene_results.group_results.get(group)[field] for field in gene_group_result_field_names])
                    for group in gene_result_analysis_groups
                ]
            )
        )

        ds = ds.annotate(gene_results=ds.gene_results.annotate(**{dataset_id: gene_results[ds.gene_id]}))

        variant_results = hl.read_table(os.path.join(dataset_path, "variant_results.ht"))

        reference_genome = variant_results.locus.dtype.reference_genome.name
        variant_info_field_names = variant_results.info.dtype.fields
        variant_info_field_types = [str(typ).rstrip("3264") for typ in variant_results.info.dtype.types]
        variant_group_result_field_names = variant_results.group_results.dtype.value_type.fields
        variant_group_result_field_types = [
            str(typ).rstrip("3264") for typ in variant_results.group_results.dtype.value_type.types
        ]
        variant_result_analysis_groups = list(
            variant_results.aggregate(hl.agg.explode(hl.agg.collect_as_set, variant_results.group_results.keys()))
        )

        variant_results = variant_results.annotate(
            info=hl.tuple([variant_results.info[field] for field in variant_info_field_names]),
            group_results=hl.array(
                [
                    hl.rbind(
                        variant_results.group_results.get(group),
                        lambda group_result: hl.or_missing(
                            hl.is_defined(group_result),
                            hl.tuple(
                                # pylint: disable=cell-var-from-loop
                                [group_result[field] for field in variant_group_result_field_names]
                                # pylint: enable=cell-var-from-loop
                            ),
                        ),
                    )
                    for group in variant_result_analysis_groups
                ]
            ),
        )

        variant_results = variant_results.annotate(
            variant_id=variant_results.locus.contig.replace("^chr", "")
            + "-"
            + hl.str(variant_results.locus.position)
            + "-"
            + variant_results.alleles[0]
            + "-"
            + variant_results.alleles[1],
            pos=variant_results.locus.position,
        )

        variant_results = variant_results.annotate(
            variant=hl.tuple([variant_results[field] for field in VARIANT_FIELDS])
        )
        variant_results = variant_results.group_by("gene_id").aggregate(
            variants=hl.agg.collect(variant_results.variant)
        )
        ds = ds.annotate(
            variants=ds.variants.annotate(
                **{
                    dataset_id: hl.or_else(
                        variant_results[ds.gene_id].variants,
                        hl.empty_array(variant_results.variants.dtype.element_type),
                    )
                }
            )
        )

        ds = ds.annotate_globals(
            meta=ds.globals.meta.annotate(
                datasets=ds.globals.meta.datasets.annotate(
                    **{
                        dataset_id: hl.struct(
                            reference_genome=reference_genome,
                            gene_result_analysis_groups=gene_result_analysis_groups or hl.empty_array(hl.tstr),
                            gene_group_result_field_names=gene_group_result_field_names or hl.empty_array(hl.tstr),
                            gene_group_result_field_types=gene_group_result_field_types or hl.empty_array(hl.tstr),
                            variant_info_field_names=variant_info_field_names or hl.empty_array(hl.tstr),
                            variant_info_field_types=variant_info_field_types or hl.empty_array(hl.tstr),
                            variant_result_analysis_groups=variant_result_analysis_groups or hl.empty_array(hl.tstr),
                            variant_group_result_field_names=variant_group_result_field_names
                            or hl.empty_array(hl.tstr),
                            variant_group_result_field_types=variant_group_result_field_types
                            or hl.empty_array(hl.tstr),
                        ),
                    }
                )
            )
        )

    return ds


def get_output_root(output_local):
    output_location = "local" if output_local else "gcs"
    output_root = pipeline_config.get("output", f"{output_location}_output_root")

    if output_local:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_root = os.path.abspath(os.path.join(script_dir, "..", "..", "..", output_root))

    return output_root


def main():
    all_datasets = pipeline_config.get("datasets", "datasets").split(",")
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--datasets",
        nargs="*",
        metavar=f"{{{','.join(all_datasets)}}}",
        required=True,
        help=f"Datasets to combine. Either 'all', or a space separated list of {', '.join(all_datasets)}",
    )

    parser.add_argument("--output-local", action="store_true", help="Output files locally instead of to cloud storage")

    args = parser.parse_args()

    if args.datasets != ["all"]:
        for dataset in args.datasets:
            if dataset not in all_datasets:
                print(f"error: invalid dataset '{dataset}' (choose from {', '.join(all_datasets)})", file=sys.stderr)
                return 1

        datasets_to_combine = args.datasets
    else:
        datasets_to_combine = all_datasets

    hl.init()

    output_root = get_output_root(args.output_local)
    combined_output_date = pipeline_config.get("output", "output_last_updated")
    output_path = os.path.join(output_root, "combined", combined_output_date, "combined.ht")
    combined_ht = combine_datasets(datasets_to_combine, output_root)
    combined_ht.write(output_path, overwrite=True)


if __name__ == "__main__":
    sys.exit(main())
