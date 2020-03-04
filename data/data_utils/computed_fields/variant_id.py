import hail as hl


def normalized_contig(locus: hl.expr.LocusExpression) -> hl.expr.StringExpression:
    """
    Normalized contig name
    """
    return locus.contig.replace("^chr", "")


def variant_id(
    locus: hl.expr.LocusExpression, alleles: hl.expr.ArrayExpression,
):
    """
    Expression for computing <chrom>-<pos>-<ref>-<alt>. Assumes alleles were split.
    """
    return normalized_contig(locus) + "-" + hl.str(locus.position) + "-" + alleles[0] + "-" + alleles[1]


def contig_number(locus: hl.expr.LocusExpression) -> hl.expr.Int32Expression:
    """
    Convert contig name to contig number
    """
    return hl.bind(
        lambda contig: (
            hl.case().when(contig == "X", 23).when(contig == "Y", 24).when(contig[0] == "M", 25).default(hl.int(contig))
        ),
        normalized_contig(locus),
    )


def x_position(locus: hl.expr.LocusExpression) -> hl.expr.Int64Expression:
    """
    Genomic position represented as a single number = contig_number * 10**9 + position.
    This represents chrom:pos more compactly and allows for easier sorting.
    """
    return hl.int64(contig_number(locus)) * 1_000_000_000 + locus.position
