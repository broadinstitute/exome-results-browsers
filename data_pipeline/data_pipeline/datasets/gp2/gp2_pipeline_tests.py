# pylint: disable=redefined-outer-name

import hail as hl
import pytest

from data_pipeline.config import pipeline_config

from .gp2_combine_input_datasets import combine_input_data, combine_variant_annotations, combine_variant_results
from .gp2_variant_results import prepare_variant_results


@pytest.fixture(scope="module")
def local_reference_data(tmp_path_factory):
    """Point the ClinVar and dbSNP reference paths at local stand-ins.

    prepare_variant_results left joins both reference tables onto the variants, so the
    test needs tables it can read without access to the GCS bucket the real ones live
    in. These hold a single row each, keyed to the chr1:10000 variant below, so that
    the joins are exercised with a match rather than only with misses.

    The schemas mirror the real tables, which declare them in the metadata.json.gz at
    the root of each .ht directory. Nothing checks that these stay in sync with the
    real tables, so they need updating if the reference data changes shape.
    """
    reference_root = tmp_path_factory.mktemp("reference_data")

    clinvar_path = str(reference_root / "clinvar_grch38_variants.ht")
    clinvar_ht = hl.Table.parallelize(
        [
            {
                "locus": hl.locus("chr1", 10000, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "clinvar_variation_id": "12345",
                "clinical_significance": ["Pathogenic", "Likely_pathogenic"],
                "clinical_significance_category": "pathogenic",
                "conflicting_clinical_significance_categories": [],
                "gold_stars": 2,
            }
        ],
        schema=hl.tstruct(
            locus=hl.tlocus(reference_genome="GRCh38"),
            alleles=hl.tarray(hl.tstr),
            clinvar_variation_id=hl.tstr,
            clinical_significance=hl.tarray(hl.tstr),
            clinical_significance_category=hl.tstr,
            conflicting_clinical_significance_categories=hl.tarray(hl.tstr),
            gold_stars=hl.tint32,
        ),
        key=["locus", "alleles"],
    )
    clinvar_ht.write(clinvar_path)

    dbsnp_path = str(reference_root / "dbSNP_grch38_rsids.ht")
    dbsnp_ht = hl.Table.parallelize(
        [
            {
                "locus": hl.locus("chr1", 10000, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "rsid": "rs1234567",
            }
        ],
        schema=hl.tstruct(
            locus=hl.tlocus(reference_genome="GRCh38"),
            alleles=hl.tarray(hl.tstr),
            rsid=hl.tstr,
        ),
        key=["locus", "alleles"],
    )
    dbsnp_ht.write(dbsnp_path)

    original_clinvar_path = pipeline_config.get("reference_data", "clinvar_grch38_path")
    original_dbsnp_path = pipeline_config.get("reference_data", "dbSNP_grch38_rsids_path")
    pipeline_config.set("reference_data", "clinvar_grch38_path", clinvar_path)
    pipeline_config.set("reference_data", "dbSNP_grch38_rsids_path", dbsnp_path)

    yield

    pipeline_config.set("reference_data", "clinvar_grch38_path", original_clinvar_path)
    pipeline_config.set("reference_data", "dbSNP_grch38_rsids_path", original_dbsnp_path)


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
                "ac_psp": [200, 21],
                "an_psp": 201,
                "af_psp": [1, 0.1],
                "ac_dlb": [200, 22],
                "an_dlb": 202,
                "af_dlb": [1, 0.1],
                "ac_msa": [200, 23],
                "an_msa": 203,
                "af_msa": [1, 0.1],
                "ac_ctrl": [200, 24],
                "an_ctrl": 204,
                "af_ctrl": [1, 0.1],
                "ac_other": [200, 25],
                "an_other": 205,
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


def test_gp2_prepare_variants(variant_hts, annotation_hts, local_reference_data):
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
    group_results_eur = group_results_dict[0].get("EUR", {})

    assert len(group_results_eur) == 14
    assert group_results_eur.wgs_ac_pd == 20
    assert group_results_eur.wgs_ac_psp == 21
    assert group_results_eur.wgs_ac_dlb == 22
    assert group_results_eur.wgs_ac_msa == 23
    assert group_results_eur.wgs_ac_ctrl == 24
    assert group_results_eur.wgs_ac_other == 25

    # The reference data joins, against the stand-in tables in local_reference_data
    info = filtered_test.info.collect()[0]
    assert info.clinvar_variation_id == "12345"
    # clinical_significance is an array in ClinVar, and is flattened to its first element
    assert info.clinical_significance == "Pathogenic"
    assert info.clinical_significance_category == "pathogenic"
    assert info.rsid == "rs1234567"
