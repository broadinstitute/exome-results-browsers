import hail as hl

# Interval covering each test gene, keyed by reference genome. GRCh38 contigs use the
# chr prefix; GRCh37 contigs do not.
TEST_GENE_INTERVALS = {
    "GRCh37": {
        "PCSK9": "1:55505221-55530525",  # ENSG00000169174
        "CHD8": "14:21853353-21924285",
    },
    "GRCh38": {
        "PCSK9": "chr1:55039447-55064852",  # ENSG00000169174
        "AKAP11": "chr13:42272152-42323261",  # ENSG00000023516
        "SHANK1": "chr19:50659255-50719802",  # ENSG00000161681
        "FRYL": "chr4:48497357-48780322",  # ENSG00000075539
        "MAGI2": "chr7:78017055-79453667",  # ENSG00000187391
        "KIAA1211L": "chr2:98793846-98936259",  # ENSG00000196872 (CRACDL)
        "DEPDC5": "chr22:31753867-31908033",
        "SETD1A": "chr16:30957754-30984664",  # ENSG00000099381
        "SAMD11": "chr1:923923-944575",  # ENSG00000187634
        # gnomAD's gencode version calls WDR78 "DNAI4", so it appears as WDR78 in the
        # gene table and DNAI4 on the single gene page.
        "WDR78": "chr1:66812885-66924856",  # ENSG00000152763
        "NOD2": "chr16:50693588-50734041",
        "GBA1": "chr1:155234452-155244699",  # ENSG00000177628
        "IL17RA": "chr22:17084954-17115694",  # ENSG00000177663
    },
}

# Per-dataset mismatches between test_genes and the intervals used to filter variant
# results. Both match pre-existing behavior.
#
# Genes filtered from a dataset's gene results but not from its variant results.
GENES_EXCLUDED_FROM_VARIANT_FILTERING = {
    "BipEx2": ("C1orf61",),  # ENSG00000125462
    "IBD": ("PCSK9",),
}

# Genes whose variants are kept even though the gene is not in the dataset's
# test_genes. ClinVar's gene results are placeholder Epi25 data, so its test_genes
# lists only PCSK9.
GENES_ADDED_TO_VARIANT_FILTERING = {
    "ClinVarGRCh38": ("GBA1", "IL17RA"),
    "GP2": ("IL17RA",),
}


def parse_test_genes(test_genes_str):
    return [gene.strip() for gene in test_genes_str.split(",")]


def get_test_gene_intervals(dataset, test_genes_str, reference_genome="GRCh38"):
    genes = [
        gene
        for gene in parse_test_genes(test_genes_str)
        if gene not in GENES_EXCLUDED_FROM_VARIANT_FILTERING.get(dataset, ())
    ]
    genes.extend(GENES_ADDED_TO_VARIANT_FILTERING.get(dataset, ()))

    interval_map = TEST_GENE_INTERVALS[reference_genome]
    unknown_genes = [gene for gene in genes if gene not in interval_map]
    if unknown_genes:
        raise ValueError(
            f"No {reference_genome} interval defined in TEST_GENE_INTERVALS for test genes {unknown_genes}. "
            "Add the interval, or list the gene in GENES_EXCLUDED_FROM_VARIANT_FILTERING "
            f"for {dataset} to skip variant filtering for it."
        )

    return parse_test_gene_intervals(",".join(interval_map[gene] for gene in genes))


def parse_test_gene_intervals(intervals_str):
    intervals = []
    for part in intervals_str.split(","):
        chrom, rest = part.strip().split(":")
        start, end = rest.split("-")
        ref = "GRCh38" if chrom.startswith("chr") else "GRCh37"
        intervals.append(
            hl.locus_interval(chrom, int(start), int(end), reference_genome=ref, includes_start=True, includes_end=True)
        )
    return intervals


def filter_gene_results_to_test_genes(results, field, test_gene_symbols):
    test_gene_set = hl.literal([s.upper() for s in test_gene_symbols])
    results = results.filter(test_gene_set.contains(results[field].upper()))
    return results.persist()


def filter_variant_results_to_test_gene_intervals(results, intervals):
    results = hl.filter_intervals(results, intervals)
    return results.persist()
