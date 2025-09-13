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


def combine_input_data(ces_variants_ht, wgs_variants_ht, ces_annotations_ht, wgs_annotations_ht):
    combined_variants_ht = combine_variant_results(ces_variants_ht, wgs_variants_ht)
    combined_annotations_ht = combine_variant_annotations(ces_annotations_ht, wgs_annotations_ht)

    return combined_variants_ht, combined_annotations_ht
