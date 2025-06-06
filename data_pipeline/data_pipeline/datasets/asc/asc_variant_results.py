import hail as hl

from data_pipeline.config import pipeline_config


CONSEQUENCE_TERMS = [
    "transcript_ablation",
    "splice_acceptor_variant",
    "splice_donor_variant",
    "stop_gained",
    "frameshift_variant",
    "stop_lost",
    "start_lost",  # new in v81
    "initiator_codon_variant",  # deprecated
    "transcript_amplification",
    "inframe_insertion",
    "inframe_deletion",
    "missense_variant",
    "protein_altering_variant",  # new in v79
    "splice_region_variant",
    "incomplete_terminal_codon_variant",
    "start_retained_variant",
    "stop_retained_variant",
    "synonymous_variant",
    "coding_sequence_variant",
    "mature_miRNA_variant",
    "5_prime_UTR_variant",
    "3_prime_UTR_variant",
    "non_coding_transcript_exon_variant",
    "non_coding_exon_variant",  # deprecated
    "intron_variant",
    "NMD_transcript_variant",
    "non_coding_transcript_variant",
    "nc_transcript_variant",  # deprecated
    "upstream_gene_variant",
    "downstream_gene_variant",
    "TFBS_ablation",
    "TFBS_amplification",
    "TF_binding_site_variant",
    "regulatory_region_ablation",
    "regulatory_region_amplification",
    "feature_elongation",
    "regulatory_region_variant",
    "feature_truncation",
    "intergenic_variant",
]

# Map of consequence term to its index in the list
CONSEQUENCE_TERM_RANKS = hl.dict({term: rank for rank, term in enumerate(CONSEQUENCE_TERMS)})


def filter_results_table_to_test_gene_intervals(results):
    pcsk9_interval = hl.locus_interval(
        "1", 55505221, 55530525, reference_genome="GRCh37", includes_start=True, includes_end=True
    )

    chd8_interval = hl.locus_interval(
        "14", 21853353, 21924285, reference_genome="GRCh37", includes_start=True, includes_end=True
    )

    results = hl.filter_intervals(results, [pcsk9_interval, chd8_interval])

    return results.persist()


def prepare_variant_results(test_genes, _output_root):
    annotations = None
    results = None

    NUM_PARTITIONS = 10 if test_genes == True else 100

    for group in ("dn", "dbs", "swe"):
        group_annotations_path = pipeline_config.get("ASC", f"{group}_variant_annotations_path")
        group_results_path = pipeline_config.get("ASC", f"{group}_variant_results_path")

        group_annotations = hl.import_table(
            group_annotations_path,
            force=True,
            key="v",
            missing="NA",
            types={
                "v": hl.tstr,
                "in_analysis": hl.tbool,
                "gene_id": hl.tstr,
                "gene_name": hl.tstr,
                "transcript_id": hl.tstr,
                "hgvsc": hl.tstr,
                "hgvsp": hl.tstr,
                "csq_analysis": hl.tstr,
                "csq_worst": hl.tstr,
                "mpc": hl.tfloat,
                "polyphen": hl.tstr,
            },
        )

        group_annotations = group_annotations.annotate(
            locus=hl.rbind(
                group_annotations.v.split(":"), lambda p: hl.locus(p[0], hl.int(p[1]), reference_genome="GRCh37")
            ),
            alleles=hl.rbind(group_annotations.v.split(":"), lambda p: [p[2], p[3]]),
        )
        group_annotations = group_annotations.key_by("locus", "alleles")
        group_annotations = group_annotations.drop("v")

        if test_genes:
            group_annotations = filter_results_table_to_test_gene_intervals(group_annotations)

        group_annotations = group_annotations.repartition(NUM_PARTITIONS, shuffle=True)

        if annotations is None:
            annotations = group_annotations
        else:
            annotations = annotations.union(group_annotations)

        group_results = hl.import_table(
            group_results_path,
            force=True,
            min_partitions=NUM_PARTITIONS,
            key="v",
            missing="NA",
            types={
                "v": hl.tstr,
                "analysis_group": hl.tstr,
                "ac_case": hl.tint,
                "an_case": hl.tint,
                "af_case": hl.tstr,
                "ac_ctrl": hl.tint,
                "an_ctrl": hl.tint,
                "af_ctrl": hl.tstr,
            },
        )

        group_results = group_results.annotate(
            locus=hl.rbind(
                group_results.v.split(":"), lambda p: hl.locus(p[0], hl.int(p[1]), reference_genome="GRCh37")
            ),
            alleles=hl.rbind(group_results.v.split(":"), lambda p: [p[2], p[3]]),
        )
        group_results = group_results.key_by("locus", "alleles")
        group_results = group_results.drop("v")

        if test_genes:
            group_results = filter_results_table_to_test_gene_intervals(group_results)

        group_results = group_results.repartition(NUM_PARTITIONS, shuffle=True)

        group_results = group_results.drop("af_case", "af_ctrl")

        group_results = group_results.annotate(
            in_analysis=group_annotations[group_results.locus, group_results.alleles].in_analysis
        )

        if results is None:
            results = group_results
        else:
            results = results.union(group_results)

    annotations = annotations.cache()
    results = results.cache()

    annotations = annotations.distinct()
    annotations = annotations.cache()

    annotations = annotations.select(
        "gene_id",
        consequence=hl.sorted(
            annotations.csq_analysis.split(","),
            lambda c: CONSEQUENCE_TERM_RANKS.get(c),  # pylint: disable=unnecessary-lambda
        )[0],
        hgvsc=annotations.hgvsc.split(":")[-1],
        hgvsp=annotations.hgvsp.split(":")[-1],
        info=hl.struct(mpc=annotations.mpc, polyphen=annotations.polyphen),
    )

    results = results.group_by("locus", "alleles").aggregate(group_results=hl.agg.collect(results.row_value))
    results = results.annotate(
        group_results=hl.dict(
            results.group_results.map(
                lambda group_result: (group_result.analysis_group, group_result.drop("analysis_group"))
            )
        )
    )

    variants = annotations.annotate(group_results=results[annotations.key].group_results)

    return variants
