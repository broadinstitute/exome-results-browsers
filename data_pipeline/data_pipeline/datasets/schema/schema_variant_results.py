import ast

import hail as hl

from data_pipeline.config import pipeline_config

test_genes_string = pipeline_config["SCHEMA"]["test_genes"]
test_genes = ast.literal_eval(test_genes_string)


def filter_results_table_to_test_gene_intervals(variants):
    test_gene_intervals = [
        hl.locus_interval(
            contig,
            start,
            end,
            reference_genome="GRCh38",
            includes_start=True,
            includes_end=True,
        )
        for _, _, contig, start, end in test_genes
    ]

    return hl.filter_intervals(variants, test_gene_intervals).persist()


def prepare_variant_results(test_genes, _output_root):
    variant_results_path = pipeline_config.get("SCHEMA", "variant_results_path")
    variant_annotations_path = pipeline_config.get("SCHEMA", "variant_annotations_path")

    variant_results = hl.read_table(variant_results_path)
    variant_annotations = hl.read_table(variant_annotations_path)

    if test_genes:
        variant_results = filter_results_table_to_test_gene_intervals(variant_results)
        variant_annotations = filter_results_table_to_test_gene_intervals(variant_annotations)

    variant_results = variant_results.select(
        ac_case=variant_results.AC_case,
        an_case=variant_results.AN_case,
        ac_ctrl=variant_results.AC_control,
        an_ctrl=variant_results.AN_control,
        n_de_novo=hl.or_else(variant_results.n_de_novo, 0),
        in_analysis=variant_results.in_analysis,
        # consequence
        # MAC
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
