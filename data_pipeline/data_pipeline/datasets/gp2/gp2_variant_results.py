import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene_interval(results):
    nek2p2_interval = hl.locus_interval(
        "chr22", 15611759, 15613096, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    results = hl.filter_intervals(results, [nek2p2_interval])

    return results


def prepare_variant_results(test_genes, _output_root):
    results = hl.read_table(pipeline_config.get("GP2", "variant_results_path"))

    if test_genes:
        results = filter_results_table_to_test_gene_interval(results)

    variants = results.group_by(results.locus, results.alleles).aggregate()

    results = results.annotate(ac_case=results.ac_case[1], ac_ctrl=results.ac_ctrl[1])

    results = results.drop("af_case", "af_ctrl")

    results = results.filter((results.ac_case > 0) | (results.ac_ctrl > 0))

    results = results.group_by("locus", "alleles").aggregate(group_results=hl.agg.collect(results.row_value))
    results = results.annotate(
        group_results=hl.dict(
            results.group_results.map(lambda group_result: (group_result.ancestry, group_result.drop("ancestry")))
        )
    )

    variants = variants.annotate(**results[variants.locus, variants.alleles])

    annotations = hl.read_table(pipeline_config.get("GP2", "variant_annotations_path"))

    annotations = annotations.select(
        "gene_id",
        consequence=annotations.consequence,
        hgvsc=annotations.hgvsc.split(":")[-1],
        # ask about hgvsp, if analysts want to display this
        hgvsp="",
        info=hl.struct(
            cadd=annotations.cadd,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    return variants
