# pylint: disable=redefined-outer-name

import hail as hl
import pytest

from .gene_filter_utils import (
    filter_gene_results_to_test_genes,
    filter_variant_results_to_test_gene_intervals,
    parse_test_gene_intervals,
)


@pytest.fixture(scope="module")
def gene_results_ht():
    ht = hl.Table.parallelize(
        [
            {"gene_id": "ENSG00000169174", "gene_symbol": "PCSK9", "pval": 0.01},
            {"gene_id": "ENSG00000177628", "gene_symbol": "GBA1", "pval": 0.02},
            {"gene_id": "ENSG00000102974", "gene_symbol": "CTCF", "pval": 0.03},
        ],
        schema=hl.tstruct(gene_id=hl.tstr, gene_symbol=hl.tstr, pval=hl.tfloat64),
    )
    return ht.key_by("gene_id")


@pytest.fixture(scope="module")
def variant_results_ht():
    # One variant inside PCSK9, one at each edge of GBA1, and one outside both.
    ht = hl.Table.parallelize(
        [
            {"locus": hl.locus("chr1", 55050000, reference_genome="GRCh38"), "alleles": ["C", "T"]},
            {"locus": hl.locus("chr1", 155234452, reference_genome="GRCh38"), "alleles": ["C", "T"]},
            {"locus": hl.locus("chr1", 155244699, reference_genome="GRCh38"), "alleles": ["C", "T"]},
            {"locus": hl.locus("chr2", 55050000, reference_genome="GRCh38"), "alleles": ["C", "T"]},
        ],
        schema=hl.tstruct(locus=hl.tlocus(reference_genome="GRCh38"), alleles=hl.tarray(hl.tstr)),
    )
    return ht.key_by("locus", "alleles")


@pytest.mark.parametrize(
    "intervals_str,expected",
    [
        ("chr1:55039447-55064852", [("chr1", 55039447, 55064852, "GRCh38")]),
        # A contig without the chr prefix means GRCh37
        ("1:55505221-55530525", [("1", 55505221, 55530525, "GRCh37")]),
        (
            "chr1:55039447-55064852, chr22:17084954-17115694",
            [("chr1", 55039447, 55064852, "GRCh38"), ("chr22", 17084954, 17115694, "GRCh38")],
        ),
    ],
)
def test_parse_test_gene_intervals(intervals_str, expected):
    intervals = hl.eval(parse_test_gene_intervals(intervals_str))

    assert [
        (i.start.contig, i.start.position, i.end.position, i.start.reference_genome.name) for i in intervals
    ] == expected
    assert all(i.includes_start and i.includes_end for i in intervals)


@pytest.mark.parametrize(
    "field,test_gene_symbols,expected",
    [
        ("gene_symbol", ["PCSK9", "GBA1"], ["GBA1", "PCSK9"]),
        ("gene_symbol", ["pcsk9"], ["PCSK9"]),  # matching ignores case
        ("gene_id", ["ENSG00000169174"], ["PCSK9"]),  # any field can be filtered on
        ("gene_symbol", ["NOD2"], []),
    ],
)
def test_filter_gene_results_to_test_genes(gene_results_ht, field, test_gene_symbols, expected):
    filtered = filter_gene_results_to_test_genes(gene_results_ht, field, test_gene_symbols)

    assert sorted(filtered.gene_symbol.collect()) == expected


@pytest.mark.parametrize(
    "intervals_str,expected_positions",
    [
        ("chr1:55039447-55064852", [55050000]),
        ("chr1:155234452-155244699", [155234452, 155244699]),  # both boundaries are kept
        ("chr1:55039447-55064852,chr1:155234452-155244699", [55050000, 155234452, 155244699]),
        ("chr3:55039447-55064852", []),  # other contigs are excluded
    ],
)
def test_filter_variant_results_to_test_gene_intervals(variant_results_ht, intervals_str, expected_positions):
    intervals = parse_test_gene_intervals(intervals_str)

    filtered = filter_variant_results_to_test_gene_intervals(variant_results_ht, intervals)

    assert [locus.position for locus in filtered.locus.collect()] == expected_positions
