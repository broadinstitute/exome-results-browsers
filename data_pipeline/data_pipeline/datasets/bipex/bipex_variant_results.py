import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene_intervals(results):
    pcsk9_interval = hl.locus_interval(
        "chr1", 55039447, 55064852, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    akap11_interval = hl.locus_interval(
        "chr1", 55039447, 55064852, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    results = hl.filter_intervals(results, [pcsk9_interval, akap11_interval])

    return results.persist()


def prepare_variant_results(test_genes, _output_root):
    results = hl.read_table(pipeline_config.get("BipEx", "variant_results_path"))

    if test_genes:
        results = filter_results_table_to_test_gene_intervals(results)

    # Get unique variants from results table
    variants = results.group_by(results.locus, results.alleles).aggregate()

    # Select AC/AF numbers for the alternate allele
    results = results.annotate(ac_case=results.ac_case[1], ac_ctrl=results.ac_ctrl[1])

    results = results.drop("af_case", "af_ctrl")

    results = results.filter((results.ac_case > 0) | (results.ac_ctrl > 0))

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
    annotations = hl.read_table(pipeline_config.get("BipEx", "variant_annotations_path"))
    annotations = annotations.filter(annotations.transcript_id == annotations.canonical_transcript_id)

    annotations = annotations.select(
        "gene_id",
        consequence=annotations.csq_analysis,
        hgvsc=annotations.hgvsc_canonical.split(":")[-1],
        hgvsp=annotations.hgvsp_canonical.split(":")[-1],
        info=hl.struct(cadd=annotations.cadd, mpc=annotations.mpc, polyphen=annotations.polyphen),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    return variants
