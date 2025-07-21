import pytest

import hail as hl

from .gp2_combine_input_datasets import combine_variant_results, combine_variant_annotations


@pytest.fixture(scope="module")
def hail_context():
    """Initializes Hail context for tests."""
    hl.init(
        spark_conf={
            "spark.driver.memory": "12g",
            "spark.executor.memory": "12g",
        }
    )
    yield
    hl.stop()


def test_combine_gp2_variant_results(hail_context):
    test_ces_variant_ht = hl.Table.parallelize(
        [
            {
                "locus": hl.locus("chr1", 10000, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10000_C_T",
                "dataset": "CES",
                "ancestry": "EUR",
                "ac_case": [10488, 0],
                "an_case": 10488,
                "af_case": [1, 0],
                "ac_ctrl": [0, 0],
                "an_ctrl": 0,
                "af_ctrl": None,
            },
            {
                "locus": hl.locus("chr1", 10001, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10001_C_T",
                "dataset": "CES",
                "ancestry": "EUR",
                "ac_case": [10488, 0],
                "an_case": 10488,
                "af_case": [1, 0],
                "ac_ctrl": [0, 0],
                "an_ctrl": 0,
                "af_ctrl": None,
            },
        ],
        schema=hl.tstruct(
            locus=hl.tlocus(reference_genome="GRCh38"),
            alleles=hl.tarray(hl.tstr),
            variant_id=hl.tstr,
            dataset=hl.tstr,
            ancestry=hl.tstr,
            ac_case=hl.tarray(hl.tint32),
            an_case=hl.tint32,
            af_case=hl.tarray(hl.tfloat64),
            ac_ctrl=hl.tarray(hl.tint32),
            an_ctrl=hl.tint32,
            af_ctrl=hl.tarray(hl.tfloat64),
        ),
    )

    test_wgs_variant_ht = hl.Table.parallelize(
        [
            {
                "locus": hl.locus("chr1", 10000, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10000_C_T",
                "dataset": "WGS",
                "ancestry": "EUR",
                "ac_case": [10488, 0],
                "an_case": 10488,
                "af_case": [1, 0],
                "ac_other": [6962, 0],
                "an_other": 6962,
                "af_other": [1, 0],
                "ac_ctrl": [0, 0],
                "an_ctrl": 0,
                "af_ctrl": None,
            },
            {
                "locus": hl.locus("chr1", 10002, reference_genome="GRCh38"),
                "alleles": ["C", "T"],
                "variant_id": "chr1_10002_C_T",
                "dataset": "WGS",
                "ancestry": "EUR",
                "ac_case": [10488, 0],
                "an_case": 10488,
                "af_case": [1, 0],
                "ac_other": [6962, 0],
                "an_other": 6962,
                "af_other": [1, 0],
                "ac_ctrl": [0, 0],
                "an_ctrl": 0,
                "af_ctrl": None,
            },
        ],
        schema=hl.tstruct(
            locus=hl.tlocus(reference_genome="GRCh38"),
            alleles=hl.tarray(hl.tstr),
            variant_id=hl.tstr,
            dataset=hl.tstr,
            ancestry=hl.tstr,
            ac_case=hl.tarray(hl.tint32),
            an_case=hl.tint32,
            af_case=hl.tarray(hl.tfloat64),
            ac_other=hl.tarray(hl.tint32),
            an_other=hl.tint32,
            af_other=hl.tarray(hl.tfloat64),
            ac_ctrl=hl.tarray(hl.tint32),
            an_ctrl=hl.tint32,
            af_ctrl=hl.tarray(hl.tfloat64),
        ),
    )

    test_combined_variant_ht = combine_variant_results(test_ces_variant_ht, test_wgs_variant_ht)

    test_combined_variant_ht.describe()
    test_combined_variant_ht.show(5)

    assert test_combined_variant_ht.count() == 4

    filtered_test = test_combined_variant_ht.filter(
        test_combined_variant_ht.locus == hl.locus("chr1", 10000, reference_genome="GRCh38")
    )
    assert filtered_test.count() == 2
