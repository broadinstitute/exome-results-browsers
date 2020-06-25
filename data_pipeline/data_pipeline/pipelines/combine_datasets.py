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


def combine_datasets(dataset_ids):
    gene_models_path = f"{pipeline_config.get('output', 'staging_path')}/gene_models.ht"
    ds = hl.read_table(gene_models_path)

    ds = ds.annotate(gene_results=hl.struct(), variants=hl.struct())
    ds = ds.annotate_globals(meta=hl.struct(variant_fields=VARIANT_FIELDS, datasets=hl.struct()))

    for dataset_id in dataset_ids:
        dataset_path = os.path.join(pipeline_config.get("output", "staging_path"), dataset_id.lower())
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
                            hl.tuple([group_result[field] for field in variant_group_result_field_names]),
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

        datasets_to_combine = args.datasets
    else:
        datasets_to_combine = all_datasets

    hl.init()

    output_path = os.path.join(pipeline_config.get("output", "staging_path"), "combined.ht")
    combine_datasets(datasets_to_combine).write(output_path, overwrite=True)


if __name__ == "__main__":
    sys.exit(main())
