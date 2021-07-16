import argparse
import os
import sys
from tempfile import NamedTemporaryFile

import hail as hl

from data_pipeline.config import pipeline_config
from data_pipeline.validation import validate_gene_results_table, validate_variant_results_table


def prepare_downloads_for_dataset(dataset_id):
    output_path = pipeline_config.get("output", "staging_path")

    dataset_prefix = os.path.join(output_path, dataset_id.lower())
    output_prefix = os.path.join(output_path, "downloads", dataset_id)

    gene_results_path = os.path.join(dataset_prefix, "gene_results.ht")
    gene_results = hl.read_table(gene_results_path)
    validate_gene_results_table(gene_results)

    gene_group_result_fields = gene_results.group_results.dtype.value_type.fields
    gene_results_dsv = gene_results
    gene_results_dsv = gene_results_dsv.transmute(
        group_results=hl.array(gene_results_dsv.group_results).map(
            lambda group_and_result: group_and_result[1]
            .annotate(group=group_and_result[0])
            .select("group", *gene_group_result_fields)
        )
    )
    gene_results_dsv = gene_results_dsv.explode(gene_results_dsv.group_results, name="group_result")
    gene_results_dsv = gene_results_dsv.transmute(**gene_results_dsv.group_result)
    gene_results_dsv.export(os.path.join(output_prefix, f"{dataset_id}_gene_results.tsv.bgz"))

    variant_results_path = os.path.join(dataset_prefix, "variant_results.ht")
    variant_results = hl.read_table(variant_results_path)
    validate_variant_results_table(variant_results)

    variant_group_result_fields = variant_results.group_results.dtype.value_type.fields
    variant_results_dsv = variant_results
    variant_results_dsv = variant_results_dsv.transmute(**variant_results_dsv.info)
    variant_results_dsv = variant_results_dsv.transmute(
        group_results=hl.array(variant_results_dsv.group_results).map(
            lambda group_and_result: group_and_result[1]
            .annotate(group=group_and_result[0])
            .select("group", *variant_group_result_fields)
        )
    )
    variant_results_dsv = variant_results_dsv.explode(variant_results_dsv.group_results, name="group_result")
    variant_results_dsv = variant_results_dsv.transmute(**variant_results_dsv.group_result)
    variant_results_dsv.export(os.path.join(output_prefix, f"{dataset_id}_variant_results.tsv.bgz"))

    variant_results_groups = variant_results.aggregate(
        hl.agg.explode(hl.agg.collect_as_set, variant_results.group_results.keys())
    )

    variant_info_fields = variant_results.info.dtype.fields
    variant_base_fields = set(variant_results.row_value) - {"info", "group_results"}

    all_fields = list(variant_base_fields) + list(variant_info_fields) + list(variant_group_result_fields)
    assert len(all_fields) == len(set(all_fields)), "Conflicting field names"

    variant_results_vcf = variant_results
    variant_results_vcf = variant_results_vcf.annotate(groups=variant_results_vcf.group_results.keys())
    variant_results_vcf = variant_results_vcf.select(
        info=hl.struct(
            **{f: variant_results_vcf[f] for f in variant_base_fields},
            **{f: variant_results_vcf.info[f] for f in variant_info_fields},
            groups=variant_results_vcf.groups,
            **dict(
                map(
                    lambda f: (
                        f,
                        variant_results_vcf.groups.map(lambda group: variant_results_vcf.group_results[group][f]),
                    ),
                    variant_group_result_fields,
                )
            ),
        ),
    )

    def _convert_type(field):
        if isinstance(field.dtype, hl.tarray):
            if field.dtype.element_type == hl.tbool:
                return field.map(hl.int)

        return field

    variant_results_vcf = variant_results_vcf.annotate(
        info=variant_results_vcf.info.annotate(**{f: _convert_type(variant_results_vcf.info[f]) for f in all_fields})
    )

    with NamedTemporaryFile("w") as header_file:
        header_file.write(f"analysis_groups={','.join(variant_results_groups)}")

        hl.export_vcf(
            variant_results_vcf,
            os.path.join(output_prefix, f"{dataset_id}_variant_results.vcf.bgz"),
            append_to_header=f"file://{header_file.name}",
            metadata={
                "info": {**{f: {"Number": str(len(variant_results_groups))} for f in variant_group_result_fields}}
            },
        )


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
        prepare_downloads_for_dataset(dataset)


if __name__ == "__main__":
    sys.exit(main())
