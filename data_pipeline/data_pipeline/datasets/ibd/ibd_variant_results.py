import os

import hail as hl

from data_pipeline.config import pipeline_config


def prepare_variant_results():
    staging_output_path = pipeline_config.get("output", "staging_path")

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


    # add vep to annotations to store in info field
    vepped_path = os.path.join(staging_output_path, 'ibd', 'variants_vepped.ht')
    if not hl.hadoop_exists(vepped_path):
        print("no vepped table found")
        variants_to_vep = variants.select()
        vepped_variants = hl.vep(variants_to_vep)
        vepped_variants.write(vepped_path, overwrite=True)

    vepped_variants_ht = hl.read_table(vepped_path)

    # annotations = annotations.annotate(vep=hl.json(vepped_variants_ht[annotations.locus, annotations.alleles].vep))
    annotations = annotations.annotate(vep=vepped_variants_ht[annotations.locus, annotations.alleles].vep)

    annotations = annotations.annotate(
        transcript_consequences=annotations.vep.transcript_consequences.map(
            lambda tc: hl.struct(
                consequence_terms = tc.consequence_terms,
                domains = tc.domains,
                gene_id = tc.gene_id,
                gene_symbol = tc.gene_symbol,
                hgnc_id = tc.hgnc_id,
                hgvsc = tc.hgvsc,
                hgvsp = tc.hgvsp,
                canonical = tc.canonical,
                lof = tc.lof,
                lof_flags = tc.lof_flags,
                lof_filter = tc.lof_filter,
                polyphen_prediction = tc.polyphen_prediction,
                sift_prediction = tc.sift_prediction,
                transcript_id = tc.transcript_id
            )
        )
    )

    annotations = annotations.annotate(transcript_consequences=hl.json(annotations.transcript_consequences))

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
            transcript_consequences=annotations.transcript_consequences,
            # vep=annotations.vep,
            # primate_ai=annotations.primate_ai_score,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])


    vepped_path = os.path.join(staging_output_path, 'ibd', 'variants_vepped.ht')
    if not hl.hadoop_exists(vepped_path):
        print("no vepped table found")
        exit(1)
        variants_to_vep = variants.select()
        vepped_variants = hl.vep(variants_to_vep)
        vepped_variants.write(vepped_path, overwrite=True)
    vepped_variants_ht = hl.read_table(vepped_path)

    variants = variants.annotate(vep=vepped_variants_ht[variants.locus, variants.alleles].vep)

    return variants
