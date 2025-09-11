import hail as hl


def filter_results_table_to_test_gene_interval(results):
    # ENSG00000177663
    il17ra_interval = hl.locus_interval(
        "chr22", 17084954, 17115694, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    results = hl.filter_intervals(results, [il17ra_interval])

    return results


def prepare_variant_results(results, annotations, test_genes, _output_root):
    if test_genes:
        results = filter_results_table_to_test_gene_interval(results)

    results = results.annotate(
        ac_case=results.ac_case[1],
        ac_ctrl=results.ac_ctrl[1],
        ac_other=hl.if_else(hl.is_defined(results.ac_other), results.ac_other[1], hl.null(hl.tint32)),
    )
    results = results.drop("af_case", "af_ctrl")
    results = results.filter((results.ac_case > 0) | (results.ac_ctrl > 0))

    results = results.group_by("locus", "alleles").aggregate(
        group_results=hl.dict(
            hl.agg.group_by(
                results.ancestry,
                hl.agg.group_by(
                    results.dataset,
                    hl.agg.take(
                        hl.struct(
                            ac_case=results.ac_case,
                            an_case=results.an_case,
                            ac_ctrl=results.ac_ctrl,
                            an_ctrl=results.an_ctrl,
                            ac_other=results.ac_other,
                            an_other=results.an_other,
                            af_other=results.af_other,
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
                            ac_case=hl.if_else(
                                hl.len(ces_stats_array) > 0, ces_stats_array[0].ac_case, hl.null(hl.tint32)
                            ),
                            an_case=hl.if_else(
                                hl.len(ces_stats_array) > 0, ces_stats_array[0].an_case, hl.null(hl.tint32)
                            ),
                            ac_ctrl=hl.if_else(
                                hl.len(ces_stats_array) > 0, ces_stats_array[0].ac_ctrl, hl.null(hl.tint32)
                            ),
                            an_ctrl=hl.if_else(
                                hl.len(ces_stats_array) > 0, ces_stats_array[0].an_ctrl, hl.null(hl.tint32)
                            ),
                            wgs_ac_case=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_case, hl.null(hl.tint32)
                            ),
                            wgs_an_case=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_case, hl.null(hl.tint32)
                            ),
                            wgs_af_case=hl.if_else(
                                hl.len(wgs_stats_array) > 0,
                                wgs_stats_array[0].ac_case / wgs_stats_array[0].an_case,
                                hl.null(hl.tint32),
                            ),
                            wgs_ac_ctrl=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_ctrl, hl.null(hl.tint32)
                            ),
                            wgs_an_ctrl=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_ctrl, hl.null(hl.tint32)
                            ),
                            wgs_af_ctrl=hl.if_else(
                                hl.len(wgs_stats_array) > 0,
                                wgs_stats_array[0].ac_ctrl / wgs_stats_array[0].an_ctrl,
                                hl.null(hl.tint32),
                            ),
                            wgs_ac_other=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_other, hl.null(hl.tint32)
                            ),
                            wgs_an_other=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_other, hl.null(hl.tint32)
                            ),
                            wgs_af_other=hl.if_else(
                                hl.len(wgs_stats_array) > 0,
                                wgs_stats_array[0].ac_other / wgs_stats_array[0].an_other,
                                hl.null(hl.tint32),
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

    annotations = annotations.select(
        "gene_id",
        consequence=annotations.consequence,
        hgvsc=annotations.hgvsc.split(":")[-1],
        hgvsp=annotations.hgvsp.split(":")[-1],
        info=hl.struct(
            cadd=annotations.cadd,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    return variants
