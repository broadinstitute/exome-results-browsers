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

    # TODO: break into helper
    # Use and filter vepped table to get correct gene_id per variant
    # =======================

    # # use my own vepped table to determine gene_id
    # vepped_path = os.path.join(staging_output_path, "ibd", "variants_vepped.ht")
    # vepped_variants_ht = hl.read_table(vepped_path)
    # transcript_consequences_ht = vepped_variants_ht.select(
    #     csqs = vepped_variants_ht.vep.transcript_consequences
    # )
    # exploded_csqs_ht = transcript_consequences_ht.explode('csqs')
    # csqs_ht = exploded_csqs_ht.select(
    #     gene_id = exploded_csqs_ht.csqs.gene_id,
    #     gene_symbol = exploded_csqs_ht.csqs.gene_symbol,
    #     mane_select = exploded_csqs_ht.csqs.mane_select,
    #     source = exploded_csqs_ht.csqs.source,
    # )
    #
    # csqs_ensembl_ht = csqs_ht.filter(csqs_ht.source == "Ensembl")
    #
    # csqs_ensembl_coding_ht = csqs_ensembl_ht.filter(
    #     csqs_ensembl_ht.consequence_term != "downstream_gene_variant"
    # )
    # csqs_ensembl_coding_ht = csqs_ensembl_coding_ht.filter(
    #     csqs_ensembl_coding_ht.consequence_term != "upstream_gene_variant"
    # )
    #
    # variant_gene_groups = csqs_ensembl_coding_ht.group_by(
    #     locus = csqs_ensembl_ht.locus,
    #     alleles = csqs_ensembl_ht.alleles,
    # ).aggregate(
    #     gene_ids = hl.agg.collect(csqs_ensembl_coding_ht.gene_id),
    #     gene_symbols = hl.agg.collect(csqs_ensembl_coding_ht.gene_symbol),
    #     gene_counts = hl.agg.counter(csqs_ensembl_coding_ht.gene_symbol),
    # )
    #
    # variant_with_gene = variant_gene_groups.annotate(
    #     gene_id = variant_gene_groups.gene_ids[0],
    #     gene_symbol = variant_gene_groups.gene_symbols[0],
    # )
    #
    # # re-order so ht.show(n) is nicer to inspect
    # variant_with_gene = variant_with_gene.select(
    #     gene_id = variant_with_gene.gene_id,
    #     gene_symbol = variant_with_gene.gene_symbol,
    #     gene_counts = variant_with_gene.gene_counts,
    #     gene_ids = variant_with_gene.gene_ids,
    #     gene_symbols = variant_with_gene.gene_symbols,
    # )
    #
    # corrected_gene_id_path = os.path.join(staging_output_path, "ibd", "gene_id_per_variant.ht")
    #
    # variant_with_gene.write(
    #     corrected_gene_id_path,
    #     overwrite=True
    # )

    # ---
    # TODO: use this to just annotate gene_id
    corrected_gene_id_path = os.path.join(staging_output_path, "ibd", "gene_id_per_variant.ht")
    gene_id_per_variant_ht = hl.read_table(corrected_gene_id_path)
    # corrected_gene_id_path = os.path.join(staging_output_path, "ibd", "gene_id_per_variant.ht")
    # ---

    # ========================

    # add vep to annotations to store in info field
    # vepped_path = os.path.join(staging_output_path, "ibd", "variants_vepped.ht")
    # if not hl.hadoop_exists(vepped_path):
    #     print("no vepped table found")
    #     variants_to_vep = variants.select()
    #     vepped_variants = hl.vep(variants_to_vep)
    #     vepped_variants.write(vepped_path, overwrite=True)

    # vepped_variants_ht = hl.read_table(vepped_path)

    # annotations = annotations.annotate(vep=vepped_variants_ht[annotations.locus, annotations.alleles].vep)

    # annotations = annotations.annotate(
    #     transcript_consequences=annotations.vep.transcript_consequences.map(
    #         lambda tc: hl.struct(
    #             consequence_terms=tc.consequence_terms,
    #             domains=tc.domains,
    #             gene_id=tc.gene_id,
    #             gene_symbol=tc.gene_symbol,
    #             hgnc_id=tc.hgnc_id,
    #             hgvsc=tc.hgvsc,
    #             hgvsp=tc.hgvsp,
    #             canonical=tc.canonical,
    #             mane_select=tc.mane_select,
    #             lof=tc.lof,
    #             lof_flags=tc.lof_flags,
    #             lof_filter=tc.lof_filter,
    #             polyphen_prediction=tc.polyphen_prediction,
    #             sift_prediction=tc.sift_prediction,
    #             transcript_id=tc.transcript_id,
    #         )
    #     )
    # )

    # annotations = annotations.annotate(transcript_consequences=hl.json(annotations.transcript_consequences))

    annotations = annotations.select(
        # don't use this gene id, use from my table instead
        # gene_id=annotations.gene_id_canonical,
        consequence=annotations.most_severe_consequence,
        hgvsc=annotations.hgvsc_canonical.split(":")[-1],
        hgvsp=annotations.hgvsp_canonical.split(":")[-1],
        info=hl.struct(
            cadd=annotations.cadd_phred,
            splice_ai=annotations.splice_ai_score,
            revel=annotations.revel_score,
            polyphen=annotations.polyphen_score_canonical,
            sift=annotations.sift_score_canonical,
            # transcript_consequences=annotations.transcript_consequences,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    # ---

    # TODO: use my table to annotate gene_id instead
    corrected_gene_id_path = os.path.join(staging_output_path, "ibd", "gene_id_per_variant.ht")
    gene_id_per_variant_ht = hl.read_table(corrected_gene_id_path)

    gene_id_per_variant_ht = gene_id_per_variant_ht.select(gene_id=gene_id_per_variant_ht.gene_id)

    variants = variants.annotate(**gene_id_per_variant_ht[variants.locus, variants.alleles])

    # ---

    most_significant_variant_per_gene = os.path.join(staging_output_path, "ibd", "genes_most_significant_variants.ht")

    if not hl.hadoop_exists(most_significant_variant_per_gene):
        exploded = variants.annotate(
            group_entries=hl.array(hl.zip(variants.group_results.keys(), variants.group_results.values()))
        ).explode("group_entries")

        exploded = exploded.annotate(group_name=exploded.group_entries[0], group_data=exploded.group_entries[1])

        exploded.drop("group_results", "group_entries")

        grouped = exploded.group_by(gene_id=exploded.gene_id, group_name=exploded.group_name,).aggregate(
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
                        # transcript_consequences=exploded.info.transcript_consequences,
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
