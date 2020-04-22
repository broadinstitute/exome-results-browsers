import argparse

import hail as hl

from data_utils.computed_fields import x_position


DEFAULT_VARIANT_RESULTS_URL = "gs://bipex-browser/200421/browser_variant_results_table.ht"
DEFAULT_VARIANT_ANNOTATIONS_URL = "gs://bipex-browser/200421/browser_variant_annotation_table.ht"


GROUP_NAMES = hl.literal(
    {
        "Bipolar Disorder": "bipolar_disorder",
        "Bipolar Disorder 1": "bipolar_disorder_1",
        "Bipolar Disorder 2": "bipolar_disorder_2",
        "Bipolar Disorder with Psychosis": "bipolar_disorder_with_psychosis",
        "Bipolar Disorder without Psychosis": "bipolar_disorder_without_psychosis",
        "Bipolar Disorder (including Schizoaffective)": "bipolar_disorder_including_schizoaffective",
    }
)


def prepare_variant_results(results_url, annotations_url):
    variant_results = hl.read_table(results_url)

    # Get unique variants from results table
    variants = variant_results.group_by(variant_results.locus, variant_results.alleles).aggregate()

    # Select AC/AF numbers for the alternate allele
    variant_results = variant_results.annotate(
        ac_case=variant_results.ac_case[1],
        af_case=variant_results.af_case[1],
        ac_ctrl=variant_results.ac_ctrl[1],
        af_ctrl=variant_results.af_ctrl[1],
    )

    # Rename analysis groups to be Elasticsearch-friendly
    variant_results = variant_results.annotate(analysis_group=GROUP_NAMES[variant_results.analysis_group])

    # Annotate variants with a struct for each analysis group
    variants = variants.annotate(groups=hl.struct())
    analysis_groups = variant_results.aggregate(hl.agg.collect_as_set(variant_results.analysis_group))
    for group in analysis_groups:
        group_results = variant_results.filter(variant_results.analysis_group == group).drop(
            "analysis_group", "variant_id"
        )
        variants = variants.annotate(
            groups=variants.groups.annotate(**{group: group_results[variants.locus, variants.alleles]})
        )

    # Merge variant annotations for canonical transcripts
    variant_annotations = hl.read_table(annotations_url)
    variant_annotations = variant_annotations.drop("variant_id")
    variant_annotations = variant_annotations.filter(
        variant_annotations.transcript_id == variant_annotations.canonical_transcript_id
    )
    variants = variants.annotate(**variant_annotations[variants.locus, variants.alleles])

    variants = variants.annotate(
        chrom=variants.locus.contig[3:], pos=variants.locus.position, xpos=x_position(variants.locus),
    )
    variants = variants.annotate(
        variant_id=variants.chrom + "-" + hl.str(variants.pos) + "-" + variants.alleles[0] + "-" + variants.alleles[1]
    )

    return variants


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--results-url", default=DEFAULT_VARIANT_RESULTS_URL)
    parser.add_argument("--annotations-url", default=DEFAULT_VARIANT_ANNOTATIONS_URL)
    parser.add_argument("output_url")
    args = parser.parse_args()

    variants = prepare_variant_results(args.results_url, args.annotations_url)

    variants.write(args.output_url)


if __name__ == "__main__":
    main()
