import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene_intervals(variants):
    pcsk9_interval_grch38 = hl.locus_interval(
        "chr1", 55039447, 55064852, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    setd1a_interval_grch38 = hl.locus_interval(
        "chr16", 30957754, 30984664, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    # ENSG00000187634
    samd11_interval_grch38 = hl.locus_interval(
        "chr1", 923923, 944575, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    variants = hl.filter_intervals(variants, [pcsk9_interval_grch38, setd1a_interval_grch38, samd11_interval_grch38])

    return variants.persist()


def prepare_variant_results(test_genes, _output_root):
    variant_results_path = pipeline_config.get("SCHEMA", "variant_results_path")
    variant_annotations_path = pipeline_config.get("SCHEMA", "variant_annotations_path")

    variant_results = hl.read_table(variant_results_path)
    variant_annotations = hl.read_table(variant_annotations_path)

    variant_partitions = variant_results.n_partitions()
    annotations_partitions = variant_annotations.n_partitions()

    print(f"Variants table has {variant_partitions} partitions")
    print(f"Annotations table has {annotations_partitions} partitions")

    # initial variants had 137k partitions
    if (not test_genes) and variant_partitions > 2000:
        print("Naive coalescing variant table")
        variant_results = variant_results.naive_coalesce(2000)

    # initial annotations had 75k partitions
    if (not test_genes) and annotations_partitions > 2000:
        print("Naive coalescing annotation table")
        variant_annotations = variant_annotations.naive_coalesce(2000)

    if test_genes:
        variant_results = filter_results_table_to_test_gene_intervals(variant_results)
        variant_annotations = filter_results_table_to_test_gene_intervals(variant_annotations)

    # Add n_denovos to AC_case
    variant_results = variant_results.annotate(
        ac_case=hl.or_else(variant_results.AC_case, 0) + hl.or_else(variant_results.n_de_novo, 0),
        an_case=variant_results.AN_case,
        ac_ctrl=variant_results.AC_control,
        an_ctrl=variant_results.AN_control,
        n_de_novo=hl.or_else(variant_results.n_de_novo, 0),
    )

    variant_results = variant_results.drop(
        "AC_case",
        "AC_control",
        "AN_case",
        "AN_control",
        "MAC",
    )

    variant_results = variant_results.annotate(
        analysis_group="meta",
    )

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

    variant_annotations = variant_annotations.select(
        gene_id=variant_annotations.gene_id,
        consequence=variant_annotations.most_severe_consequence,
        transcript_id=variant_annotations.transcript_id,
        hgvsc=variant_annotations.hgvsc.split(":")[-1],
        hgvsp=variant_annotations.hgvsp.split(":")[-1],
        info=hl.struct(
            misrank_percentile=variant_annotations["MisRank_Percentile"],
            mpc=variant_annotations["MPC"],
            alpha_missense=variant_annotations["AlphaMissense"],
            misfit_s=variant_annotations["MisFit_S"],
            pop_eve=variant_annotations["PopEVE"],
        ),
    )

    variants = variant_annotations.annotate(**variant_results[variant_annotations.key])
    variants = variants.filter(hl.is_defined(variants.group_results))

    return variants
