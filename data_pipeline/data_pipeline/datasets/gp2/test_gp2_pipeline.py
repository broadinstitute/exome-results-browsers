# pylint: disable=redefined-outer-name

import pytest

import hail as hl

from .gp2_combine_input_datasets import combine_variant_results, combine_variant_annotations, combine_input_data
from .gp2_variant_results import prepare_variant_results


@pytest.fixture(scope="module")
def variant_hts():
    ces_variant_ht = hl.Table.parallelize(
        [
            {
                "locus": hl.locus("chr1", 10000, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10000_C_T",
                "dataset": "CES",
                "ancestry": "EUR",
                "ac_pd": [600, 20],
                "an_pd": 600,
                "af_pd": [1, 0.033],
            },
            {
                "locus": hl.locus("chr1", 10001, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10001_C_T",
                "dataset": "CES",
                "ancestry": "EUR",
                "ac_pd": [800, 20],
                "an_pd": 800,
                "af_pd": [1, 0.025],
            },
        ],
        schema=hl.tstruct(
            locus=hl.tlocus(reference_genome="GRCh38"),
            alleles=hl.tarray(hl.tstr),
            variant_id=hl.tstr,
            dataset=hl.tstr,
            ancestry=hl.tstr,
            ac_pd=hl.tarray(hl.tint32),
            an_pd=hl.tint32,
            af_pd=hl.tarray(hl.tfloat64),
        ),
    )
    ces_variant_ht = ces_variant_ht.key_by("locus", "alleles")

    wgs_variant_ht = hl.Table.parallelize(
        [
            {
                "locus": hl.locus("chr1", 10000, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10000_C_T",
                "dataset": "WGS",
                "ancestry": "EUR",
                "ac_pd": [200, 20],
                "an_pd": 200,
                "af_pd": [1, 0.1],
                "ac_psp": [200, 20],
                "an_psp": 200,
                "af_psp": [1, 0.1],
                "ac_dlb": [200, 20],
                "an_dlb": 200,
                "af_dlb": [1, 0.1],
                "ac_msa": [200, 20],
                "an_msa": 200,
                "af_msa": [1, 0.1],
                "ac_ctrl": [200, 20],
                "an_ctrl": 200,
                "af_ctrl": [1, 0.1],
                "ac_other": [200, 20],
                "an_other": 200,
                "af_other": [1, 0.1],
            },
            {
                "locus": hl.locus("chr1", 10002, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10002_C_T",
                "dataset": "WGS",
                "ancestry": "EUR",
                "ac_pd": [400, 20],
                "an_pd": 400,
                "af_pd": [1, 0.05],
                "ac_psp": [400, 20],
                "an_psp": 400,
                "af_psp": [1, 0.05],
                "ac_dlb": [400, 20],
                "an_dlb": 400,
                "af_dlb": [1, 0.05],
                "ac_msa": [400, 20],
                "an_msa": 400,
                "af_msa": [1, 0.05],
                "ac_ctrl": [400, 20],
                "an_ctrl": 400,
                "af_ctrl": [1, 0.05],
                "ac_other": [400, 20],
                "an_other": 400,
                "af_other": [1, 0.05],
            },
        ],
        schema=hl.tstruct(
            locus=hl.tlocus(reference_genome="GRCh38"),
            alleles=hl.tarray(hl.tstr),
            variant_id=hl.tstr,
            dataset=hl.tstr,
            ancestry=hl.tstr,
            ac_pd=hl.tarray(hl.tint32),
            an_pd=hl.tint32,
            af_pd=hl.tarray(hl.tfloat64),
            ac_psp=hl.tarray(hl.tint32),
            an_psp=hl.tint32,
            af_psp=hl.tarray(hl.tfloat64),
            ac_dlb=hl.tarray(hl.tint32),
            an_dlb=hl.tint32,
            af_dlb=hl.tarray(hl.tfloat64),
            ac_msa=hl.tarray(hl.tint32),
            an_msa=hl.tint32,
            af_msa=hl.tarray(hl.tfloat64),
            ac_ctrl=hl.tarray(hl.tint32),
            an_ctrl=hl.tint32,
            af_ctrl=hl.tarray(hl.tfloat64),
            ac_other=hl.tarray(hl.tint32),
            an_other=hl.tint32,
            af_other=hl.tarray(hl.tfloat64),
        ),
    )
    wgs_variant_ht = wgs_variant_ht.key_by("locus", "alleles")

    return {
        "ces_variant_ht": ces_variant_ht,
        "wgs_variant_ht": wgs_variant_ht,
    }


@pytest.fixture(scope="module")
def annotation_hts():
    ces_annotation_ht = hl.Table.parallelize(
        [
            {
                "locus": hl.locus("chr1", 10000, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10000_C_T",
                "gene_id": "ENSG00000123456",
                "transcript_id": "ENST00000234567",
                "consequence": "test_consequence_1",
                "gene_name": "ABC123",
                "hgvsc": "ENST00000234567.1:n.123C>T",
                "hgvsp": None,
                "cadd": 1.01,
                "revel": 2.01,
            },
            {
                "locus": hl.locus("chr1", 10001, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10001_C_T",
                "gene_id": "ENSG00000123456",
                "transcript_id": "ENST00000234567",
                "consequence": "test_consequence_2",
                "gene_name": "ABC123",
                "hgvsc": "ENST00000234567.1:n.234G>C",
                "hgvsp": None,
                "cadd": 1.02,
                "revel": 2.02,
            },
        ],
        schema=hl.tstruct(
            locus=hl.tlocus(reference_genome="GRCh38"),
            alleles=hl.tarray(hl.tstr),
            variant_id=hl.tstr,
            gene_id=hl.tstr,
            transcript_id=hl.tstr,
            consequence=hl.tstr,
            gene_name=hl.tstr,
            hgvsc=hl.tstr,
            hgvsp=hl.tstr,
            cadd=hl.tfloat64,
            revel=hl.tfloat64,
        ),
    )
    ces_annotation_ht = ces_annotation_ht.key_by("locus", "alleles")

    wgs_annotation_ht = hl.Table.parallelize(
        [
            {
                "locus": hl.locus("chr1", 10000, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10000_C_T",
                "gene_id": "ENSG00000123456",
                "transcript_id": "ENST00000234567",
                "consequence": "test_consequence_3",
                "gene_name": "ABC123",
                "hgvsc": "ENST00000234567.1:n.123C>T",
                "hgvsp": None,
                "cadd": 1.03,
                "revel": 2.03,
            },
            {
                "locus": hl.locus("chr1", 10002, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10002_C_T",
                "gene_id": "ENSG00000123456",
                "transcript_id": "ENST00000234567",
                "consequence": "test_consequence_4",
                "gene_name": "ABC123",
                "hgvsc": "ENST00000234567.1:n.234G>C",
                "hgvsp": None,
                "cadd": 1.04,
                "revel": 2.04,
            },
        ],
        schema=hl.tstruct(
            locus=hl.tlocus(reference_genome="GRCh38"),
            alleles=hl.tarray(hl.tstr),
            variant_id=hl.tstr,
            gene_id=hl.tstr,
            transcript_id=hl.tstr,
            consequence=hl.tstr,
            gene_name=hl.tstr,
            hgvsc=hl.tstr,
            hgvsp=hl.tstr,
            cadd=hl.tfloat64,
            revel=hl.tfloat64,
        ),
    )
    wgs_annotation_ht = wgs_annotation_ht.key_by("locus", "alleles")

    return {
        "ces_annotation_ht": ces_annotation_ht,
        "wgs_annotation_ht": wgs_annotation_ht,
    }


def test_combine_gp2_variant_results(variant_hts):
    ces_variant_ht = variant_hts["ces_variant_ht"]
    wgs_variant_ht = variant_hts["wgs_variant_ht"]

    combined_variant_ht = combine_variant_results(ces_variant_ht, wgs_variant_ht)

    assert combined_variant_ht.count() == 4

    filtered_test = combined_variant_ht.filter(
        combined_variant_ht.locus == hl.locus("chr1", 10000, reference_genome="GRCh38")
    )
    assert filtered_test.count() == 2


def test_combine_gp2_variant_annotations(annotation_hts):
    ces_annotation_ht = annotation_hts["ces_annotation_ht"]
    wgs_annotation_ht = annotation_hts["wgs_annotation_ht"]

    combined_variant_ht = combine_variant_annotations(ces_annotation_ht, wgs_annotation_ht)

    assert combined_variant_ht.count() == 4

    filtered_test = combined_variant_ht.filter(
        combined_variant_ht.locus == hl.locus("chr1", 10000, reference_genome="GRCh38")
    )
    assert filtered_test.count() == 2


def test_gp2_prepare_variants(variant_hts, annotation_hts):
    ces_variant_ht = variant_hts["ces_variant_ht"]
    wgs_variant_ht = variant_hts["wgs_variant_ht"]
    ces_annotation_ht = annotation_hts["ces_annotation_ht"]
    wgs_annotation_ht = annotation_hts["wgs_annotation_ht"]

    output_local = False
    combined_variant_ht, combined_annotation_ht = combine_input_data(
        ces_variant_ht,
        wgs_variant_ht,
        ces_annotation_ht,
        wgs_annotation_ht,
        output_local,
    )

    variants_ht = prepare_variant_results(combined_variant_ht, combined_annotation_ht, None, None)

    filtered_test = variants_ht.filter(variants_ht.locus == hl.locus("chr1", 10000, reference_genome="GRCh38"))
    assert filtered_test.count() == 1

    group_results_dict = filtered_test.group_results.collect()
    group_results_eur_array = group_results_dict[0].get("EUR", {})

    assert len(group_results_eur_array) == 14
