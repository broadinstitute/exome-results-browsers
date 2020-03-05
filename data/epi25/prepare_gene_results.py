import argparse

import hail as hl


DEFAULT_GENE_RESULTS_URL = "gs://epi-browser/2018-11-07_epi25-exome-browser-gene-results-table-reduced.csv"


def prepare_gene_results(gene_results_url, genes_url=None):
    ds = hl.import_table(
        gene_results_url,
        delimiter=",",
        missing="NA",
        quote='"',
        types={
            "gene_id": hl.tstr,
            "gene_name": hl.tstr,
            "description": hl.tstr,
            "pval_meta": hl.tfloat,
            "analysis_group": hl.tstr,
            # LoF
            "xcase_lof": hl.tint,
            "xctrl_lof": hl.tint,
            "pval_lof": hl.tfloat,
            # MPC
            "xcase_mpc": hl.tint,
            "xctrl_mpc": hl.tint,
            "pval_mpc": hl.tfloat,
            # Inframe indel
            "xcase_infrIndel": hl.tint,
            "xctrl_infrIndel": hl.tint,
            "pval_infrIndel": hl.tfloat,
        },
    )

    # Rename EE group
    ds = ds.annotate(analysis_group=hl.cond(ds.analysis_group == "EE", "DEE", ds.analysis_group))

    # "Meta" p-val was carried over from SCHEMA's data format but isn't descriptive of Epi25
    ds = ds.rename({"pval_meta": "pval", "description": "gene_description"})

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


if __name__ == "__main__":
    main()
