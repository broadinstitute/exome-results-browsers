import hail as hl


def filter_results_table_to_test_gene_interval(results):

    # ENSG00000169174
    pcsk9_interval = hl.locus_interval(
        "chr1", 55039447, 55064852, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    # ENSG00000177628
    gba1_interval = hl.locus_interval(
        "chr1", 155234452, 155244699, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    # ENSG00000177663
    il17ra_interval = hl.locus_interval(
        "chr22", 17084954, 17115694, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    results = hl.filter_intervals(results, [pcsk9_interval, gba1_interval, il17ra_interval])

    return results


def prepare_variant_results(results, annotations, test_genes, _output_root):
    if test_genes:
        results = filter_results_table_to_test_gene_interval(results)

    results = results.annotate(
        ac_pd=results.ac_pd[1],
        ac_psp=hl.if_else(hl.is_defined(results.ac_psp), results.ac_other[1], hl.missing(hl.tint32)),
        ac_dlb=hl.if_else(hl.is_defined(results.ac_dlb), results.ac_other[1], hl.missing(hl.tint32)),
        ac_msa=hl.if_else(hl.is_defined(results.ac_msa), results.ac_other[1], hl.missing(hl.tint32)),
        ac_ctrl=hl.if_else(hl.is_defined(results.ac_ctrl), results.ac_other[1], hl.missing(hl.tint32)),
        ac_other=hl.if_else(hl.is_defined(results.ac_other), results.ac_other[1], hl.missing(hl.tint32)),
    )
    results = results.drop(
        "af_pd",
        "af_psp",
        "af_dlb",
        "af_msa",
        "af_ctrl",
        "af_other",
    )
    results = results.filter(
        (results.ac_pd > 0)
        | (results.ac_psp > 0)
        | (results.ac_dlb > 0)
        | (results.ac_msa > 0)
        | (results.ac_other > 0)
        | (results.ac_ctrl > 0)
    )

    results = results.group_by("locus", "alleles").aggregate(
        group_results=hl.dict(
            hl.agg.group_by(
                results.ancestry,
                hl.agg.group_by(
                    results.dataset,
                    hl.agg.take(
                        hl.struct(
                            ac_pd=results.ac_pd,
                            an_pd=results.an_pd,
                            ac_psp=results.ac_psp,
                            an_psp=results.an_psp,
                            ac_dlb=results.ac_dlb,
                            an_dlb=results.an_dlb,
                            ac_msa=results.ac_msa,
                            an_msa=results.an_msa,
                            ac_ctrl=results.ac_ctrl,
                            an_ctrl=results.an_ctrl,
                            ac_other=results.ac_other,
                            an_other=results.an_other,
                        ),
                        1,
                    ),
                ),
            )
        )
    )

    results = results.annotate(
        group_results=hl.dict(
            hl.map(
                lambda item: (
                    item[0],
                    hl.bind(
                        lambda wgs_stats_array, ces_stats_array: hl.struct(
                            wgs_ac_pd=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_pd, hl.missing(hl.tint32)
                            ),
                            wgs_an_pd=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_pd, hl.missing(hl.tint32)
                            ),
                            wgs_ac_psp=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_psp, hl.missing(hl.tint32)
                            ),
                            wgs_an_psp=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_psp, hl.missing(hl.tint32)
                            ),
                            wgs_ac_dlb=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_dlb, hl.missing(hl.tint32)
                            ),
                            wgs_an_dlb=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_dlb, hl.missing(hl.tint32)
                            ),
                            wgs_ac_msa=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_msa, hl.missing(hl.tint32)
                            ),
                            wgs_an_msa=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_msa, hl.missing(hl.tint32)
                            ),
                            wgs_ac_ctrl=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_ctrl, hl.missing(hl.tint32)
                            ),
                            wgs_an_ctrl=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_ctrl, hl.missing(hl.tint32)
                            ),
                            wgs_ac_other=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_other, hl.missing(hl.tint32)
                            ),
                            wgs_an_other=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_other, hl.missing(hl.tint32)
                            ),
                            ces_ac_pd=hl.if_else(
                                hl.len(ces_stats_array) > 0, ces_stats_array[0].ac_pd, hl.missing(hl.tint32)
                            ),
                            ces_an_pd=hl.if_else(
                                hl.len(ces_stats_array) > 0, ces_stats_array[0].an_pd, hl.missing(hl.tint32)
                            ),
                        ),
                        item[1].get("WGS"),
                        item[1].get("CES"),
                    ),
                ),
                results.group_results.items(),
            )
        )
    )

    variants = results.key_by("locus", "alleles")

    # keep this in sync with clinvar_grch38_path in config.ini
    clinvar_grch38_path = "gs://exome-results-browsers/reference/clinvar_grch38_variants.ht"
    clinvar = hl.read_table(clinvar_grch38_path)
    clinvar = clinvar.select(
        "clinvar_variation_id",
        "clinical_significance_category",
        clinical_significance=clinvar.clinical_significance[0],
    )
    annotations = annotations.annotate(**clinvar[annotations.locus, annotations.alleles])

    # keep this in sync with dbSNP_grch38_rsids_path in config.ini
    dbSNP_grch38_path = "gs://exome-results-browsers/reference/dbSNP_grch38_rsids.ht"
    dbSNP_rsids = hl.read_table(dbSNP_grch38_path)
    dbSNP_rsids = dbSNP_rsids.select_globals()
    dbSNP_rsids = dbSNP_rsids.select(
        "rsid",
    )
    annotations = annotations.annotate(**dbSNP_rsids[annotations.locus, annotations.alleles])

    annotations = annotations.select(
        "gene_id",
        consequence=annotations.consequence,
        hgvsc=annotations.hgvsc.split(":")[-1],
        hgvsp=annotations.hgvsp.split(":")[-1],
        info=hl.struct(
            cadd=annotations.cadd,
            revel=annotations.revel,
            clinvar_variation_id=annotations.clinvar_variation_id,
            clinical_significance=annotations.clinical_significance,
            clinical_significance_category=annotations.clinical_significance_category,
            rsid=annotations.rsid,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    return variants
