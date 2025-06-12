import os

import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene_interval(results):
    nod2_interval = hl.locus_interval(
        "chr16", 50693588, 50734041, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    results = hl.filter_intervals(results, [nod2_interval])

    results = results.repartition(1)

    return results.persist()


def add_vep_to_annotations(staging_output_path, variants_ht, annotations_ht, test_genes):
    print("  Running add_vep_to_annotations")

    vepped_path = os.path.join(staging_output_path, "ibd", "variants_vepped.ht")

    print(f"  Checking in {vepped_path} for VEP table")

    output_exists = hl.hadoop_exists(vepped_path)

    print(f"Path exists?: {output_exists}")

    if not output_exists:
        print("No VEP'd table found, running VEP ...")
        variants_to_vep = variants_ht.select()
        vepped_variants = hl.vep(variants_to_vep)
        vepped_variants.write(vepped_path, overwrite=True)

    vepped_variants_ht = hl.read_table(vepped_path)

    if test_genes is not None:
        vepped_variants_ht = filter_results_table_to_test_gene_interval(vepped_variants_ht)

    annotations_ht = annotations_ht.annotate(vep=vepped_variants_ht[annotations_ht.locus, annotations_ht.alleles].vep)

    annotations_ht = annotations_ht.annotate(
        transcript_consequences=annotations_ht.vep.transcript_consequences.map(
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

    annotations_ht = annotations_ht.annotate(transcript_consequences=hl.json(annotations_ht.transcript_consequences))

    return annotations_ht


def generate_gene_id_per_variant_table(vepped_path, test_genes):
    print("    Running generate_gene_id_per_variant_table")

    vepped_variants_ht = hl.read_table(vepped_path)

    if test_genes:
        print("Subsetting vepped table in gen. gene ID to only those in variants")
        vepped_variants_ht = filter_results_table_to_test_gene_interval(vepped_variants_ht)
        vepped_variants_ht = vepped_variants_ht.persist()

    transcript_consequences_ht = vepped_variants_ht.select(csqs=vepped_variants_ht.vep.transcript_consequences)
    exploded_csqs_ht = transcript_consequences_ht.explode("csqs")
    csqs_ht = exploded_csqs_ht.select(
        gene_id=exploded_csqs_ht.csqs.gene_id,
        gene_symbol=exploded_csqs_ht.csqs.gene_symbol,
        mane_select=exploded_csqs_ht.csqs.mane_select,
        source=exploded_csqs_ht.csqs.source,
        consequence_term=exploded_csqs_ht.csqs.consequence_terms[0],
    )

    csqs_ensembl_ht = csqs_ht.filter(csqs_ht.source == "Ensembl")

    # filter out downstream and upstream variant as we only show exons
    #   in the exome results browsers, this fixes the problems of
    #   multiple mane select transcripts per variant
    csqs_ensembl_coding_ht = csqs_ensembl_ht.filter(csqs_ensembl_ht.consequence_term != "downstream_gene_variant")

    csqs_ensembl_coding_ht = csqs_ensembl_coding_ht.filter(
        csqs_ensembl_coding_ht.consequence_term != "upstream_gene_variant"
    )

    variant_gene_groups = csqs_ensembl_coding_ht.group_by(
        locus=csqs_ensembl_coding_ht.locus,
        alleles=csqs_ensembl_coding_ht.alleles,
    ).aggregate(
        gene_ids=hl.agg.collect(csqs_ensembl_coding_ht.gene_id),
        gene_symbols=hl.agg.collect(csqs_ensembl_coding_ht.gene_symbol),
        gene_counts=hl.agg.counter(csqs_ensembl_coding_ht.gene_symbol),
    )

    variant_with_gene = variant_gene_groups.annotate(
        gene_id=variant_gene_groups.gene_ids[0],
        gene_symbol=variant_gene_groups.gene_symbols[0],
    )

    variant_with_gene = variant_with_gene.select(
        gene_id=variant_with_gene.gene_id,
        gene_symbol=variant_with_gene.gene_symbol,
        gene_counts=variant_with_gene.gene_counts,
        gene_ids=variant_with_gene.gene_ids,
        gene_symbols=variant_with_gene.gene_symbols,
    )

    return variant_with_gene


def annotate_variants_with_corrected_gene_id(staging_output_path, variants_ht, test_genes):
    print("  Running annotate_variants_with_corrected_gene_id")
    vepped_path = os.path.join(staging_output_path, "ibd", "variants_vepped.ht")

    corrected_gene_id_path = os.path.join(staging_output_path, "ibd", "gene_id_per_variant.ht")

    vepped_table_exists = hl.hadoop_exists(vepped_path)
    corrected_gene_id_table_exists = hl.hadoop_exists(corrected_gene_id_path)

    if not vepped_table_exists:
        print("No vepped table found, exiting ...")
        exit(1)

    if not corrected_gene_id_table_exists:
        variant_with_correct_gene_id = generate_gene_id_per_variant_table(vepped_path, test_genes)
        variant_with_correct_gene_id.write(corrected_gene_id_path, overwrite=True)

    # annotate result table with corrected gene_id
    gene_id_per_variant_ht = hl.read_table(corrected_gene_id_path)
    gene_id_per_variant_ht = gene_id_per_variant_ht.select(gene_id=gene_id_per_variant_ht.gene_id)
    corrected_gene_id_variants_ht = variants_ht.annotate(
        **gene_id_per_variant_ht[variants_ht.locus, variants_ht.alleles]
    )

    return corrected_gene_id_variants_ht


def generate_most_significant_variant_per_gene_table(staging_output_path, variants_ht):
    print("  Running generate_most_significant_variant_per_gene_table")
    most_significant_variant_per_gene_path = os.path.join(
        staging_output_path, "ibd", "genes_most_significant_variants.ht"
    )

    if not hl.hadoop_exists(most_significant_variant_per_gene_path):
        exploded_ht = variants_ht.annotate(
            group_entries=hl.array(hl.zip(variants_ht.group_results.keys(), variants_ht.group_results.values()))
        ).explode("group_entries")

        exploded_ht = exploded_ht.annotate(
            group_name=exploded_ht.group_entries[0], group_data=exploded_ht.group_entries[1]
        )

        exploded_ht.drop("group_results", "group_entries")

        exploded_ht = exploded_ht.persist()

        print("Working on table by analysis group")
        individual_analysis_group_ht = exploded_ht.group_by(
            gene_id=exploded_ht.gene_id, group_name=exploded_ht.group_name
        ).aggregate(
            most_significant_variant=hl.agg.take(
                hl.struct(
                    P_meta=exploded_ht.group_data.P_meta,
                    variant_data=hl.struct(
                        **exploded_ht.group_data,
                        gene_id=exploded_ht.gene_id,
                        consequence=exploded_ht.consequence,
                        hgvsc=exploded_ht.hgvsc,
                        hgvsp=exploded_ht.hgvsp,
                        cadd=exploded_ht.info.cadd,
                        splice_ai=exploded_ht.info.splice_ai,
                        revel=exploded_ht.info.revel,
                        polyphen=exploded_ht.info.polyphen,
                        sift=exploded_ht.info.sift,
                    ),
                ),
                1,
                ordering=exploded_ht.group_data.P_meta,
            )[0]
        )

        individual_analysis_group_ht = individual_analysis_group_ht.persist()

        # write out intermediate table in case we want this, since we've already done the work
        individual_analysis_group_ht.write(
            os.path.join(staging_output_path, "ibd", "gene_most_significant_variant_per_analysis_group.ht"),
            overwrite=True,
        )

        print("Working on table grouped by gene")
        grouped_by_gene_ht = individual_analysis_group_ht.group_by(individual_analysis_group_ht.gene_id).aggregate(
            most_significant_variant_per_group=hl.dict(
                hl.agg.collect(
                    (
                        individual_analysis_group_ht.group_name,
                        individual_analysis_group_ht.most_significant_variant.variant_data,
                    )
                )
            )
        )

        grouped_by_gene_ht.write(most_significant_variant_per_gene_path, overwrite=True)


def prepare_variant_results(test_genes, output_root):
    print("Running IBD prepare_variant_results")

    staging_output_path = output_root

    results = hl.read_table(pipeline_config.get("IBD", "variant_results_path")).drop("filter")

    if test_genes:
        results = filter_results_table_to_test_gene_interval(results)

    # Get unique variants from results table
    variants = results.group_by(results.locus, results.alleles).aggregate()

    # Select AC/AF numbers for the reference and alternate alleles
    results = results.annotate(
        ac_case=results.ac_case[0],
        an_case=results.ac_case[1],
        ac_ctrl=results.ac_control[0],
        an_ctrl=results.ac_control[1],
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
    annotations = add_vep_to_annotations(staging_output_path, variants, annotations, test_genes)

    annotations = annotations.select(
        # gene_id now comes from the table we generate
        consequence=annotations.most_severe_consequence,
        hgvsc=annotations.hgvsc_canonical.split(":")[-1],
        hgvsp=annotations.hgvsp_canonical.split(":")[-1],
        info=hl.struct(
            cadd=annotations.cadd_phred,
            revel=annotations.revel_score,
            polyphen=annotations.polyphen_score_canonical,
            splice_ai=annotations.splice_ai_score,
            sift=annotations.sift_score_canonical,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    # use our VEP table to determine gene_id per variant
    variants = annotate_variants_with_corrected_gene_id(staging_output_path, variants, test_genes)

    # generate and save most significant variant per analysis group for each Gene
    generate_most_significant_variant_per_gene_table(staging_output_path, variants)

    return variants
