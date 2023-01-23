import hail as hl

from data_pipeline.config import pipeline_config


def prepare_variant_results():
    results = hl.read_table(pipeline_config.get("Epi25", "variant_results_path"))

    # Get unique variants from results table
    variants = results.group_by(results.locus, results.alleles).aggregate()

    # Select AC/AF numbers for the alternate allele n
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
    annotations = hl.read_table(pipeline_config.get("Epi25", "variant_annotations_path"))
    annotations = annotations.filter(annotations.transcript_id == annotations.canonical_transcript_id)

    annotations = annotations.select(
        "gene_id",
        consequence=annotations.csq_analysis,
        hgvsc=annotations.hgvsc_canonical.split(":")[-1],
        hgvsp=annotations.hgvsp_canonical.split(":")[-1],
        info=hl.struct(mpc=annotations.mpc, polyphen=annotations.polyphen),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    return variants
