import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene_intervals(results):

    # ENSG00000169174
    pcsk9_interval = hl.locus_interval(
        "chr1", 55039447, 55064852, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    # ENSG00000023516
    akap11_interval = hl.locus_interval(
        "chr13", 42272152, 42323261, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    results = hl.filter_intervals(results, [pcsk9_interval, akap11_interval])

    return results.persist()


def prepare_variant_results(test_genes, _output_root):
    results = hl.read_table(pipeline_config.get("BipEx2", "variant_results_path"))

    if test_genes:
        results = filter_results_table_to_test_gene_intervals(results)

    # Get unique variants from results table
    variants = results.group_by(results.locus, results.alleles).aggregate()

    # Select AC/AF numbers for the alternate allele
    results = results.annotate(
        ac_case=results.AC_case,
        an_case=results.AN_case,
        ac_ctrl=results.AC_ctrl,
        an_ctrl=results.AN_ctrl,
        mac=results.MAC,
        analysis_group="meta",
    )

    results = results.drop(
        "AC_case",
        "AN_case",
        "AC_ctrl",
        "AN_ctrl",
        #
        "MAC",
        "consequence",
        # "worst_csq_for_variant_canonical",
        # "missense_passing",
    )

    results = results.filter((results.ac_case > 0) | (results.ac_ctrl > 0))

    results = results.select(
        "analysis_group",
        "ac_case",
        "an_case",
        "ac_ctrl",
        "an_ctrl",
        "mac",  # int
        "worst_csq_for_variant_canonical",  # string
        "missense_passing",  # bool
        "in_analysis",  # bool
    )

    # Annotate variants with a struct for each analysis group
    results = results.group_by("locus", "alleles").aggregate(group_results=hl.agg.collect(results.row_value))
    results = results.annotate(
        group_results=hl.dict(
            results.group_results.map(
                lambda group_result: (group_result.analysis_group, group_result.drop("analysis_group"))
            )
        )
    )

    variants = variants.annotate(**results[variants.locus, variants.alleles])

    # Merge variant annotations for canonical transcripts
    annotations = hl.read_table(pipeline_config.get("BipEx2", "variant_annotations_path"))

    annotations = annotations.select(
        "gene_id",
        consequence=annotations.most_severe_consequence,
        hgvsc=annotations.hgvsc.split(":")[-1],
        hgvsp=annotations.hgvsp.split(":")[-1],
        info=hl.struct(
            mpc=annotations.MPC,
            alpha_missense=annotations.AlphaMissense,
            misfit_s=annotations.MisFit_S,
            pop_eve=annotations.PopEVE,
            misrank_percentile=annotations.MisRank_Percentile,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    return variants
