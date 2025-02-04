import hail as hl

from data_pipeline.config import pipeline_config


def prepare_variant_results():
    results = hl.read_table(pipeline_config.get("IBD", "variant_results_path"))

    # Get unique variants from results table
    variants = results.group_by(results.locus, results.alleles).aggregate()

    # Select AC/AF numbers for the reference and alternate alleles
    results = results.annotate(
        ac_case=results.ac_case[1],
        ac_ctrl=results.ac_control[1],
        an_case=results.ac_case[0],
        an_ctrl=results.ac_control[0],
    )

    # pylint: disable=broad-exception-raised
    # TODO: also, in gene results I should figure out what is going on with all the
    # bajillion fields I'm returning (0_001_03, etc)
    # need to check the input schema of something like Epi25 vs IBD

    results = results.drop("ac_control")

    results = results.filter((results.ac_case > 0) | (results.ac_ctrl > 0))

    # Annotate variants with a struct for each analysis group, rename the analysis groups
    results = results.group_by("locus", "alleles").aggregate(group_results=hl.agg.collect(results.row_value))
    results = results.annotate(
        group_results=hl.dict(
            results.group_results.map(
                lambda group_result: (
                    hl.switch(group_result.analysis_group)
                    .when("ibd-control", "IBD")
                    .when("cd-control", "CD")
                    .when("uc-control", "UC")
                    .or_missing(),
                    group_result.drop("analysis_group"),
                )
            )
        )
    )

    variants = variants.annotate(**results[variants.locus, variants.alleles])

    # Merge variant annotations for canonical transcripts
    annotations = hl.read_table(pipeline_config.get("IBD", "variant_annotations_path"))

    # Not actually sure which annotations we need
    annotations = annotations.select(
        gene_id=annotations.gene_id_canonical,
        consequence=annotations.most_severe_consequence,
        hgvsc=annotations.hgvsc_canonical.split(":")[-1],
        hgvsp=annotations.hgvsp_canonical.split(":")[-1],
        info=hl.struct(
            cadd=annotations.cadd_phred,
            revel=annotations.revel_score,
            polyphen=annotations.polyphen_score_canonical,
            splice_ai=annotations.splice_ai_score,
            # TODO: ask about which annotations we want to display?
            sift=annotations.sift_score_canonical,
            # primate_ai=annotations.primate_ai_score,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    return variants
