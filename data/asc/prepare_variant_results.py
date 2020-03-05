import argparse

import hail as hl

from data_utils.computed_fields import variant_id, x_position
from data_utils.computed_fields.vep import consequence_term_rank


DEFAULT_TABLE_URLS = [
    (
        "gs://asc-browser/ASC_DN_variant_annotation_table_2019-04-16.tsv.gz",
        "gs://asc-browser/ASC_DN_variant_results_table_2019-05-06.tsv.gz",
    ),
    (
        "gs://asc-browser/DBS_variant_annotation_table_2019-04-16.tsv.gz",
        "gs://asc-browser/DBS_variant_results_table_2019-04-16.tsv.gz",
    ),
    (
        "gs://asc-browser/SWE_variant_annotation_table_2019-04-16.tsv.gz",
        "gs://asc-browser/SWE_variant_results_table_2019-04-16.tsv.gz",
    ),
]


def prepare_variant_results(table_urls):
    annotations = None
    analysis_groups = []

    for annotations_table_url, results_table_url in table_urls:
        group_annotations = hl.import_table(
            annotations_table_url,
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

        group_results = hl.import_table(
            results_table_url,
            force=True,
            key="v",
            missing="NA",
            types={
                "v": hl.tstr,
                "analysis_group": hl.tstr,
                "ac_case": hl.tint,
                "an_case": hl.tstr,
                "af_case": hl.tstr,
                "ac_ctrl": hl.tint,
                "an_ctrl": hl.tstr,
                "af_ctrl": hl.tstr,
            },
        )

        groups_in_table = group_results.aggregate(hl.agg.collect_as_set(group_results.analysis_group))
        assert len(groups_in_table) == 1, groups_in_table
        group_name = groups_in_table.pop()
        analysis_groups.append(group_name)

        group_results = group_results.annotate(
            an_case=hl.int(group_results.an_case),
            af_case=hl.float(group_results.af_case),
            an_ctrl=hl.int(group_results.an_ctrl),
            af_ctrl=hl.float(group_results.af_ctrl),
            in_analysis=group_annotations[group_results.v].in_analysis,
        )

        group_results.drop("analysis_group").write(f"temp_{group_name}.ht")

        group_annotations = group_annotations.drop("in_analysis")

        if annotations is None:
            annotations = group_annotations
        else:
            annotations = annotations.union(group_annotations)

    annotations = annotations.distinct()

    annotations = annotations.annotate(
        filters="PASS",
        csq_analysis=hl.sorted(annotations.csq_analysis.split(","), lambda c: consequence_term_rank(c))[0],
        csq_worst=hl.sorted(annotations.csq_worst.split(","), lambda c: consequence_term_rank(c))[0],
        canonical_transcript_id=annotations.transcript_id,
        hgvsc_canonical=annotations.hgvsc,
        hgvsp_canonical=annotations.hgvsp,
    )

    annotations = annotations.annotate(
        locus=hl.locus(annotations.v.split(":")[0], hl.int(annotations.v.split(":")[1])),
        alleles=annotations.v.split(":")[2:4],
    )

    annotations = annotations.annotate(
        variant_id=variant_id(annotations.locus, annotations.alleles),
        chrom=annotations.locus.contig,
        pos=annotations.locus.position,
        xpos=x_position(annotations.locus),
        alt=annotations.alleles[1],
        ref=annotations.alleles[0],
    )

    annotations = annotations.drop("locus", "alleles")

    annotations = annotations.annotate(groups=hl.struct())
    for group_name in analysis_groups:
        results = hl.read_table(f"temp_{group_name}.ht")
        annotations = annotations.annotate(groups=annotations.groups.annotate(**{group_name: results[annotations.key]}))

    annotations = annotations.key_by().drop("v")

    return annotations


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("output_url")
    args = parser.parse_args()

    ds = prepare_variant_results(DEFAULT_TABLE_URLS)

    ds.write(args.output_url)


if __name__ == "__main__":
    main()
