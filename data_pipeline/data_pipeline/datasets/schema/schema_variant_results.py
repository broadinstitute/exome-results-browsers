import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene_intervals(results):
    pcsk9_interval = hl.locus_interval(
        "1", 55505221, 55530525, reference_genome="GRCh37", includes_start=True, includes_end=True
    )

    setd1a_interval = hl.locus_interval(
        "16", 30968615, 30996437, reference_genome="GRCh37", includes_start=True, includes_end=True
    )

    results = hl.filter_intervals(results, [pcsk9_interval, setd1a_interval])

    return results.persist()


def prepare_variant_results(test_genes, _output_root):
    results_path = pipeline_config.get("SCHEMA", "variant_results_path")
    annotations_path = pipeline_config.get("SCHEMA", "variant_annotations_path")

    results = hl.read_table(results_path)

    if test_genes:
        results = filter_results_table_to_test_gene_intervals(results)

    results = results.drop("v", "af_case", "af_ctrl")

    # Add n_denovos to AC_case
    results = results.annotate(ac_case=hl.or_else(results.ac_case, 0) + hl.or_else(results.n_denovos, 0))

    results = results.annotate(source=hl.delimit(hl.sorted(hl.array(results.source)), ", "))

    results = results.group_by("locus", "alleles").aggregate(group_results=hl.agg.collect(results.row_value))
    results = results.annotate(
        group_results=hl.dict(
            results.group_results.map(
                lambda group_result: (group_result.analysis_group, group_result.drop("analysis_group"))
            )
        )
    )

    variants = hl.read_table(annotations_path)
    variants = variants.select(
        gene_id=variants.gene_id,
        consequence=hl.case()
        .when((variants.canonical_term == "missense_variant") & (variants.mpc >= 3), "missense_variant_mpc_>=3")
        .when((variants.canonical_term == "missense_variant") & (variants.mpc >= 2), "missense_variant_mpc_2-3")
        .when(variants.canonical_term == "missense_variant", "missense_variant_mpc_<2")
        .default(variants.canonical_term),
        hgvsc=variants.hgvsc_canonical.split(":")[-1],
        hgvsp=variants.hgvsp_canonical.split(":")[-1],
        info=hl.struct(cadd=variants.cadd, mpc=variants.mpc, polyphen=variants.polyphen),
    )

    variants = variants.annotate(**results[variants.key])
    variants = variants.filter(hl.is_defined(variants.group_results))

    return variants
