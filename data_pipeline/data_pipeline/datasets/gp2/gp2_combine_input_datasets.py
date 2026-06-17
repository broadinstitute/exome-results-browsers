import hail as hl


def filter_results_table_to_test_gene_interval(results):
    print("Subsetting data")

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


def combine_variant_results(ces_variants_ht, wgs_variants_ht):
    print("Combining variant results")

    combined_variants_ht = ces_variants_ht.union(wgs_variants_ht, unify=True)
    return combined_variants_ht


def combine_variant_annotations(ces_annotations_ht, wgs_annotations_ht):
    print("Combining variant annotations")

    # wgs is ordered differently, re-order to allow union
    wgs_annotations_ht = wgs_annotations_ht.select(
        wgs_annotations_ht.variant_id,
        wgs_annotations_ht.gene_id,
        wgs_annotations_ht.transcript_id,
        wgs_annotations_ht.consequence,
        wgs_annotations_ht.gene_name,
        wgs_annotations_ht.hgvsc,
        wgs_annotations_ht.hgvsp,
        wgs_annotations_ht.cadd,
    )

    combined_annotations_ht = ces_annotations_ht.union(wgs_annotations_ht)
    return combined_annotations_ht


def combine_input_data(ces_variants_ht, wgs_variants_ht, ces_annotations_ht, wgs_annotations_ht, test_genes):
    if test_genes:
        print("Received test_genes arg, subsetting input data")
        ces_variants_ht = filter_results_table_to_test_gene_interval(ces_variants_ht)
        ces_annotations_ht = filter_results_table_to_test_gene_interval(ces_annotations_ht)

        wgs_variants_ht = filter_results_table_to_test_gene_interval(wgs_variants_ht)
        wgs_annotations_ht = filter_results_table_to_test_gene_interval(wgs_annotations_ht)

    combined_variants_ht = combine_variant_results(ces_variants_ht, wgs_variants_ht)
    combined_annotations_ht = combine_variant_annotations(ces_annotations_ht, wgs_annotations_ht)

    return combined_variants_ht, combined_annotations_ht
