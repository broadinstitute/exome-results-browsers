# pylint: disable=redefined-outer-name

import hail as hl
import pytest

from data_pipeline.gene_filter_utils import (
    TEST_GENE_INTERVALS,
    filter_gene_results_to_test_genes,
    filter_variant_results_to_test_gene_intervals,
    get_test_gene_intervals,
    parse_test_gene_intervals,
    parse_test_genes,
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


def test_parse_test_genes():
    assert parse_test_genes("PCSK9, NOD2 ,GBA1") == ["PCSK9", "NOD2", "GBA1"]


def test_all_test_gene_intervals_match_their_reference_genome():
    for genome, interval_map in TEST_GENE_INTERVALS.items():
        for interval in parse_test_gene_intervals(",".join(interval_map.values())):
            assert hl.eval(interval).start.reference_genome.name == genome


def interval_contigs_and_positions(intervals):
    return [(i.start.contig, i.start.position, i.end.position) for i in map(hl.eval, intervals)]


def test_get_test_gene_intervals_looks_up_genes():
    intervals = get_test_gene_intervals("Epi25", "PCSK9,DEPDC5")
    assert interval_contigs_and_positions(intervals) == [
        ("chr1", 55039447, 55064852),
        ("chr22", 31753867, 31908033),
    ]


def test_get_test_gene_intervals_uses_requested_reference_genome():
    intervals = get_test_gene_intervals("ASC", "PCSK9,CHD8", reference_genome="GRCh37")
    assert interval_contigs_and_positions(intervals) == [
        ("1", 55505221, 55530525),
        ("14", 21853353, 21924285),
    ]


@pytest.mark.parametrize(
    "dataset,test_genes_str,expected_contigs",
    [
        # IBD's PCSK9 and BipEx2's C1orf61 appear in gene results but are excluded
        # from variant filtering
        ("IBD", "PCSK9,NOD2", ["chr16"]),
        ("BipEx2", "PCSK9,C1orf61", ["chr1"]),
        # ClinVar and GP2 keep variants for genes beyond their test_genes
        ("ClinVarGRCh38", "PCSK9", ["chr1", "chr1", "chr22"]),
        ("GP2", "PCSK9,GBA1", ["chr1", "chr1", "chr22"]),
    ],
)
def test_get_test_gene_intervals_applies_dataset_exceptions(dataset, test_genes_str, expected_contigs):
    intervals = get_test_gene_intervals(dataset, test_genes_str)
    assert [contig for contig, _, _ in interval_contigs_and_positions(intervals)] == expected_contigs


def test_get_test_gene_intervals_rejects_unknown_genes():
    with pytest.raises(ValueError, match="No GRCh38 interval defined.*NOTAGENE"):
        get_test_gene_intervals("Epi25", "PCSK9,NOTAGENE")
