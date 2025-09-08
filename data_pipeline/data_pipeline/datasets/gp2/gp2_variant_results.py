import hail as hl


def filter_results_table_to_test_gene_interval(results):
    nek2p2_interval = hl.locus_interval(
        "chr22", 15611759, 15613096, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    results = hl.filter_intervals(results, [nek2p2_interval])

    return results


def prepare_variant_results(results, annotations, test_genes, _output_root):
    if test_genes:
        results = filter_results_table_to_test_gene_interval(results)

    results = results.annotate(ac_case=results.ac_case[1], ac_ctrl=results.ac_ctrl[1])
    results = results.drop("af_case", "af_ctrl")
    results = results.filter((results.ac_case > 0) | (results.ac_ctrl > 0))

    results = results.group_by("locus", "alleles").aggregate(
        group_results=hl.dict(
            hl.agg.group_by(
                results.ancestry,
                hl.agg.group_by(
                    results.dataset,
                    hl.agg.collect(
                        hl.struct(
                            ac_case=results.ac_case,
                            an_case=results.an_case,
                            ac_ctrl=results.ac_ctrl,
                            an_ctrl=results.an_ctrl,
                        )
                    ),
                ),
            )
        )
    )

    results = results.annotate(
        group_results=hl.dict(
            results.group_results.items().map(
                lambda item: (
                    item[0],
                    item[1].map_values(
                        lambda values: hl.if_else(
                            hl.len(values) > 0,
                            hl.struct(**values[0]),
                            hl.struct(
                                ac_case=hl.null(hl.tint32),
                                an_case=hl.null(hl.tint32),
                                ac_ctrl=hl.null(hl.tint32),
                                an_ctrl=hl.null(hl.tint32),
                            ),
                        )
                    ),
                )
            )
        )
    )

    variants = results.key_by("locus", "alleles")

    annotations = annotations.select(
        "gene_id",
        consequence=annotations.consequence,
        hgvsc=annotations.hgvsc.split(":")[-1],
        # ask about hgvsp, if analysts want to display this
        hgvsp="",
        info=hl.struct(
            cadd=annotations.cadd,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    print(variants.describe())
    print(variants.show(3))

    return variants
