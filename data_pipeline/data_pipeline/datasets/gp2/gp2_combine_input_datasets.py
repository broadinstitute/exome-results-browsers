import hail as hl


def combine_variant_results(ces_variants_ht, wgs_variants_ht):
    print("Combining variant results")
    combined_variants_ht = ces_variants_ht.union(wgs_variants_ht, unify=True)
    return combined_variants_ht


def combine_variant_annotations(ces_annotations_ht, wgs_annotations_ht):
    print("Combining variant annotations")
    combined_annotations_ht = ces_annotations_ht.union(wgs_annotations_ht)
    return combined_annotations_ht


def combine_input_data():
    ces_variants_path = "gs://gp2-parkinsons-browser/2025-03-28/clinical-exome-data/handoff_variants_results.ht"
    wgs_variants_path = "gs://gp2-parkinsons-browser/2025-03-28/whole-genome-data/handoff_variants_results.ht"
    ces_variants_ht = hl.read_table(ces_variants_path)
    wgs_variants_ht = hl.read_table(wgs_variants_path)

    combined_variants_ht = combine_variant_results(ces_variants_ht, wgs_variants_ht)

    combined_variants_output_path = (
        "gs://gp2-parkinsons-browser/2025-03-28/combined-data/chr22_exome_variants_results.ht"
    )
    combined_variants_ht.write(combined_variants_output_path, overwrite=True)

    ces_annotations_path = "gs://gp2-parkinsons-browser/2025-03-28/clinical-exome-data/handoff_variants_annotations.ht"
    wgs_annotations_path = "gs://gp2-parkinsons-browser/2025-03-28/whole-genome-data/handoff_variants_annotations.ht"
    ces_annotations_ht = hl.read_table(ces_annotations_path)
    wgs_annotations_ht = hl.read_table(wgs_annotations_path)

    combined_annotations_ht = combine_variant_annotations(ces_annotations_ht, wgs_annotations_ht)

    combined_annotations_output_path = (
        "gs://gp2-parkinsons-browser/2025-03-28/combined-data/chr22_exome_variants_annotations.ht"
    )
    combined_annotations_ht.write(combined_annotations_output_path, overwrite=True)
