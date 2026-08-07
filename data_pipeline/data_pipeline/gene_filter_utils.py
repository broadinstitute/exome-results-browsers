import hail as hl


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
