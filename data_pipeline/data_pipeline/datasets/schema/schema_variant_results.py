import hail as hl

from data_pipeline.config import pipeline_config
<<<<<<< HEAD
from data_pipeline.gene_filter_utils import filter_variant_results_to_test_gene_intervals, parse_test_gene_intervals
=======
from data_pipeline.gene_filter_utils import filter_variant_results_to_test_gene_intervals, get_test_gene_intervals
>>>>>>> 27039f863e5e213f1eb717a7b662cf3b3ab33268


def prepare_variant_results(test_genes, _output_root):
    variant_results_path = pipeline_config.get("SCHEMA", "variant_results_path")
    variant_annotations_path = pipeline_config.get("SCHEMA", "variant_annotations_path")

    variant_results = hl.read_table(variant_results_path)
    variant_annotations = hl.read_table(variant_annotations_path)

    if test_genes:
<<<<<<< HEAD
        results = filter_variant_results_to_test_gene_intervals(
            results, parse_test_gene_intervals(pipeline_config.get("SCHEMA", "test_gene_intervals"))
        )
=======
        test_gene_intervals = get_test_gene_intervals("SCHEMA", pipeline_config.get("SCHEMA", "test_genes"))
        variant_results = filter_variant_results_to_test_gene_intervals(variant_results, test_gene_intervals)
        variant_annotations = filter_variant_results_to_test_gene_intervals(variant_annotations, test_gene_intervals)
>>>>>>> 27039f863e5e213f1eb717a7b662cf3b3ab33268

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
