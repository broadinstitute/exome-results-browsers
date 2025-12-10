import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene_intervals(variants):
    print("Filtering to test intervals ...")
    # pcsk9_interval = hl.locus_interval(
    #     "1", 55505221, 55530525, reference_genome="GRCh37", includes_start=True, includes_end=True
    # )
    #
    # setd1a_interval = hl.locus_interval(
    #     "16", 30968615, 30996437, reference_genome="GRCh37", includes_start=True, includes_end=True
    # )
    pcsk9_interval_grch38 = hl.locus_interval(
        "chr1", 55039447, 55064852, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    setd1a_interval_grch38 = hl.locus_interval(
        "chr16", 30957754, 30984664, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    variants = hl.filter_intervals(variants, [pcsk9_interval_grch38, setd1a_interval_grch38])

    return variants.persist()


def prepare_variant_results(test_genes, _output_root):
    variant_results_path = pipeline_config.get("SCHEMA", "variant_results_path")
    variant_annotations_path = pipeline_config.get("SCHEMA", "variant_annotations_path")

    variant_results = hl.read_table(variant_results_path)
    variant_annotations = hl.read_table(variant_annotations_path)

    if test_genes:
        variant_results = filter_results_table_to_test_gene_intervals(variant_results)
        variant_annotations = filter_results_table_to_test_gene_intervals(variant_annotations)

    # Add n_denovos to AC_case
    variant_results = variant_results.annotate(
        ac_case=hl.or_else(variant_results.AC_case, 0) + hl.or_else(variant_results.n_de_novo, 0),
        an_case=variant_results.AN_case,
        ac_ctrl=variant_results.AC_control,
        an_ctrl=variant_results.AN_control,
    )

    variant_results = variant_results.drop(
        "AC_case",
        "AC_control",
        "AN_case",
        "AN_control",
        "MAC",
    )

    # results = results.annotate(source=hl.delimit(hl.sorted(hl.array(results.source)), ", "))

    variant_results = variant_results.annotate(
        # source="meta",
        analysis_group="meta",
    )

    # results = results.annotate(source=hl.delimit(hl.sorted(hl.array(results.source)), ", "))

    variant_results = variant_results.group_by("locus", "alleles").aggregate(
        group_results=hl.agg.collect(variant_results.row_value)
    )
    variant_results = variant_results.annotate(
        group_results=hl.dict(
            variant_results.group_results.map(
                lambda group_result: (group_result.analysis_group, group_result.drop("analysis_group"))
            )
        )
    )

    # variant_annotations = hl.read_table(variant_annotations_path)

    # variants = variants.select(
    #     gene_id=variants.gene_id,
    #     consequence=hl.case()
    #     .when((variants.canonical_term == "missense_variant") & (variants.mpc >= 3), "missense_variant_mpc_>=3")
    #     .when((variants.canonical_term == "missense_variant") & (variants.mpc >= 2), "missense_variant_mpc_2-3")
    #     .when(variants.canonical_term == "missense_variant", "missense_variant_mpc_<2")
    #     .default(variants.canonical_term),
    #     hgvsc=variants.hgvsc_canonical.split(":")[-1],
    #     hgvsp=variants.hgvsp_canonical.split(":")[-1],
    #     info=hl.struct(cadd=variants.cadd, mpc=variants.mpc, polyphen=variants.polyphen),
    # )

    variant_annotations = variant_annotations.select(
        gene_id=variant_annotations.gene_id,
        consequence=variant_annotations.most_severe_consequence,
        transcript_id=variant_annotations.transcript_id,
        hgvsc=variant_annotations.hgvsc.split(":")[-1],
        hgvsp=variant_annotations.hgvsp.split(":")[-1],
        info=hl.struct(
            misrank_percentil=variant_annotations["MisRank_Percentile"],
            mpc=variant_annotations["MPC"],
            alpha_missense=variant_annotations["AlphaMissense"],
            misfit_s=variant_annotations["MisFit_S"],
            pop_eve=variant_annotations["PopEVE"],
        ),
    )

    variants = variant_annotations.annotate(**variant_results[variant_annotations.key])
    variants = variants.filter(hl.is_defined(variants.group_results))

    return variants
