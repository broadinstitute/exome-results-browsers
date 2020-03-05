import argparse

import hail as hl

from data_utils.computed_fields import x_position


DEFAULT_VARIANT_RESULTS_URL = "gs://epi-browser/2018-11-27_epi25-exome-browser-variant-results-table.tsv.gz"
DEFAULT_VARIANT_ANNOTATIONS_URL = "gs://epi-browser/2018-11-27_epi25-exome-browser-variant-annotation-table.tsv.gz"


def prepare_variant_results(results_url, annotations_url):
    variant_annotations = hl.import_table(
        annotations_url,
        force_bgz=True,
        min_partitions=100,
        key="Variant ID",
        find_replace=(r"^([\dXY]+):(\d+):([ACTG]+):([ACTG]+)", "$1-$2-$3-$4"),
        missing="NA",
        types={
            "Variant ID": hl.tstr,
            "CADD": hl.tfloat,
            "Comment": hl.tstr,
            "Consequence (canonical)": hl.tstr,
            "Consequence (for analysis)": hl.tstr,
            "Consequence (worst)": hl.tstr,
            "Flags": hl.tstr,
            "Gene ID": hl.tstr,
            "Gene name": hl.tstr,
            "HGVSc (canonical)": hl.tstr,
            "HGVSc": hl.tstr,
            "HGVSp (canonical)": hl.tstr,
            "HGVSp": hl.tstr,
            "In analysis": hl.tbool,
            "MPC": hl.tfloat,
            "Polyphen": hl.tstr,
            "Source": hl.tstr,
            "Transcript ID (canonical)": hl.tstr,
            "Transcript ID(s)": hl.tstr,
        },
    )

    variant_annotations = variant_annotations.rename(
        {
            "Variant ID": "variant_id",
            "CADD": "cadd",
            "Comment": "comment",
            "Consequence (canonical)": "csq_canonical",
            "Consequence (for analysis)": "csq_analysis",
            "Consequence (worst)": "csq_worst",
            "Flags": "flags",
            "Gene ID": "gene_id",
            "Gene name": "gene_name",
            "HGVSc (canonical)": "hgvsc_canonical",
            "HGVSc": "hgvsc",
            "HGVSp (canonical)": "hgvsp_canonical",
            "HGVSp": "hgvsp",
            "In analysis": "in_analysis",
            "MPC": "mpc",
            "Polyphen": "polyphen",
            "Source": "source",
            "Transcript ID (canonical)": "canonical_transcript_id",
            "Transcript ID(s)": "transcript_id",
        }
    )

    variant_results = hl.import_table(
        results_url,
        force_bgz=True,
        min_partitions=100,
        key="Variant ID",
        find_replace=(r"^([\dXY]+):(\d+):([ACTG]+):([ACTG]+)", "$1-$2-$3-$4"),
        missing="NA",
        types={
            "Variant ID": hl.tstr,
            "AC case": hl.tint,
            "AC control": hl.tint,
            "AF case": hl.tfloat,
            "AF control": hl.tfloat,
            "AN case": hl.tint,
            "AN control": hl.tint,
            "Analysis group": hl.tstr,
            "Estimate": hl.tfloat,
            "I2": hl.tfloat,
            "N denovos": hl.tint,
            "P-value": hl.tfloat,
            "Qp": hl.tfloat,
            "SE": hl.tfloat,
        },
    )

    variant_results = variant_results.rename(
        {
            "Variant ID": "variant_id",
            "AC case": "ac_case",
            "AC control": "ac_ctrl",
            "AF case": "af_case",
            "AF control": "af_ctrl",
            "AN case": "an_case",
            "AN control": "an_ctrl",
            "Analysis group": "analysis_group",
            "Estimate": "est",
            "I2": "i2",
            "N denovos": "n_denovos",
            "P-value": "p",
            "Qp": "qp",
            "SE": "se",
        },
    )

    # Rename "EE" analysis group to "DEE"
    variant_results = variant_results.annotate(
        analysis_group=hl.cond(variant_results.analysis_group == "EE", "DEE", variant_results.analysis_group)
    )

    variants = variant_annotations.annotate(groups=hl.struct())
    analysis_groups = variant_results.aggregate(hl.agg.collect_as_set(variant_results.analysis_group))
    for group in analysis_groups:
        group_results = variant_results.filter(variant_results.analysis_group == group).drop("analysis_group")
        variants = variants.annotate(groups=variants.groups.annotate(**{group: group_results[variants.variant_id]}))

    variants = variants.annotate(
        chrom=variants.variant_id.split("-")[0], pos=hl.int(variants.variant_id.split("-")[1]),
    )
    variants = variants.annotate(xpos=x_position(hl.locus(variants.chrom, variants.pos)))

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
