import argparse

import hail as hl


DEFAULT_GENE_RESULTS_URL = "gs://asc-browser/ASC_gene_results_table_for_browser_2019-04-14.tsv"


def prepare_gene_results(gene_results_url, genes_url=None):
    ds = hl.import_table(
        gene_results_url,
        missing="",
        types={
            "gene_name": hl.tstr,
            "gene_id": hl.tstr,
            "description": hl.tstr,
            "analysis_group": hl.tstr,
            "xcase_dn_ptv": hl.tint,
            "xcont_dn_ptv": hl.tint,
            "xcase_dn_misa": hl.tint,
            "xcont_dn_misa": hl.tint,
            "xcase_dn_misb": hl.tint,
            "xcont_dn_misb": hl.tint,
            "xcase_dbs_ptv": hl.tint,
            "xcont_dbs_ptv": hl.tint,
            "xcase_swe_ptv": hl.tint,
            "xcont_swe_ptv": hl.tint,
            "xcase_tut": hl.tint,
            "xcont_tut": hl.tint,
            "qval": hl.tfloat,
        },
    )

    ds = ds.rename({"description": "gene_description"})

    if genes_url:
        genes = hl.read_table(genes_url)
        genes = genes.key_by("gene_id")
        ds = ds.annotate(chrom=genes[ds.gene_id].chrom, pos=genes[ds.gene_id].start)

    return ds


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--gene-results-url", default=DEFAULT_GENE_RESULTS_URL)
    parser.add_argument("--genes-url")
    parser.add_argument("output_url")
    args = parser.parse_args()

    ds = prepare_gene_results(args.gene_results_url, args.genes_url)

    ds.write(args.output_url)
