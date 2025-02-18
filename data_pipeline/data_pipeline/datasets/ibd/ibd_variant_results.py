import os

import hail as hl

from data_pipeline.config import pipeline_config


def prepare_variant_results():
    staging_output_path = pipeline_config.get("output", "staging_path")

    results = hl.read_table(pipeline_config.get("IBD", "variant_results_path")).drop("filter")

    # Get unique variants from results table
    variants = results.group_by(results.locus, results.alleles).aggregate()

    # Select AC/AF numbers for the reference and alternate alleles
    results = results.annotate(
        ac_case=results.ac_case[1],
        ac_ctrl=results.ac_control[1],
        an_case=results.ac_case[0],
        an_ctrl=results.ac_control[0],
    )

    results = results.drop("ac_control", "an_control")

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
                    group_result.drop("analysis_group").annotate(
                        # explicitly cast these as  floats, as some fields are anomalously
                        #   strings in the Feb 2025 data handoff (e.g. 'BETA_Twist')
                        P_meta=hl.float(group_result.P_meta),
                        BETA_meta=hl.float(group_result.BETA_meta),
                        HetP=hl.float(group_result.HetP),
                        gnomad_v4_1_genome_nfe_freq=hl.float(group_result.gnomADv4_1_genome_nfe_frq),
                        P_Twist=hl.float(group_result.P_Twist),
                        BETA_Twist=hl.float(group_result.BETA_Twist),
                        P_Nextera=hl.float(group_result.P_Nextera),
                        BETA_Nextera=hl.float(group_result.BETA_Nextera),
                        P_Sanger_WES=hl.float(group_result.P_Sanger_WES),
                        BETA_Sanger_WES=hl.float(group_result.BETA_Sanger_WES),
                        P_UKBB=hl.float(group_result.P_UKBB),
                        BETA_UKBB=hl.float(group_result.BETA_UKBB),
                        P_Sanger_WGS=hl.float(group_result.P_Sanger_WGS),
                        BETA_Sanger_WGS=hl.float(group_result.BETA_Sanger_WGS),
                        P_regeneron=hl.float(group_result.P_regeneron),
                        BETA_regeneron=hl.float(group_result.BETA_regeneron),
                    ),
                )
            )
        )
    )

    variants = variants.annotate(**results[variants.locus, variants.alleles])

    # Merge variant annotations for canonical transcripts
    annotations = hl.read_table(pipeline_config.get("IBD", "variant_annotations_path"))

    # VEP variants and store transcript consequences in info field
    vepped_path = os.path.join(staging_output_path, "ibd", "variants_vepped.ht")
    if not hl.hadoop_exists(vepped_path):
        print("No VEP'd table found, running VEP")
        variants_to_vep = variants.select()
        vepped_variants = hl.vep(variants_to_vep)
        vepped_variants.write(vepped_path, overwrite=True)

    vepped_variants_ht = hl.read_table(vepped_path)

    annotations = annotations.annotate(vep=vepped_variants_ht[annotations.locus, annotations.alleles].vep)

    annotations = annotations.annotate(
        transcript_consequences=annotations.vep.transcript_consequences.map(
            lambda tc: hl.struct(
                consequence_terms=tc.consequence_terms,
                domains=tc.domains,
                gene_id=tc.gene_id,
                gene_symbol=tc.gene_symbol,
                hgnc_id=tc.hgnc_id,
                hgvsc=tc.hgvsc,
                hgvsp=tc.hgvsp,
                canonical=tc.canonical,
                mane_select=tc.mane_select,
                lof=tc.lof,
                lof_flags=tc.lof_flags,
                lof_filter=tc.lof_filter,
                polyphen_prediction=tc.polyphen_prediction,
                sift_prediction=tc.sift_prediction,
                transcript_id=tc.transcript_id,
            )
        )
    )

    annotations = annotations.annotate(transcript_consequences=hl.json(annotations.transcript_consequences))

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
            sift=annotations.sift_score_canonical,
            transcript_consequences=annotations.transcript_consequences,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    # generate and save most significant variant per analysis group for each Gene
    most_significant_variant_per_gene = os.path.join(staging_output_path, "ibd", "genes_most_significant_variants.ht")

    if not hl.hadoop_exists(most_significant_variant_per_gene):

        exploded = variants.annotate(
            group_entries=hl.array(hl.zip(variants.group_results.keys(), variants.group_results.values()))
        ).explode("group_entries")

        exploded = exploded.annotate(group_name=exploded.group_entries[0], group_data=exploded.group_entries[1])

        exploded.drop("group_results", "group_entries")

        grouped = exploded.group_by(gene_id=exploded.gene_id, group_name=exploded.group_name).aggregate(
            most_significant_variant=hl.agg.take(
                hl.struct(
                    P_meta=exploded.group_data.P_meta,
                    variant_data=hl.struct(
                        **exploded.group_data,
                        gene_id=exploded.gene_id,
                        consequence=exploded.consequence,
                        hgvsc=exploded.hgvsc,
                        hgvsp=exploded.hgvsp,
                        cadd=exploded.info.cadd,
                        splice_ai=exploded.info.splice_ai,
                        revel=exploded.info.revel,
                        polyphen=exploded.info.polyphen,
                        sift=exploded.info.sift,
                        transcript_consequences=exploded.info.transcript_consequences,
                    ),
                ),
                1,
                ordering=exploded.group_data.P_meta,
            )[0]
        )

        grouped.write(
            os.path.join(staging_output_path, "ibd", "gene_most_significant_variant_per_analysis_group.ht"),
            overwrite=True,
        )

        final_table = grouped.group_by(grouped.gene_id).aggregate(
            most_significant_variant_per_group=hl.dict(
                hl.agg.collect((grouped.group_name, grouped.most_significant_variant.variant_data))
            )
        )

        final_table.write(most_significant_variant_per_gene, overwrite=True)

    return variants
