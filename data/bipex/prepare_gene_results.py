import argparse

import hail as hl


DEFAULT_GENE_RESULTS_URL = "gs://bipex-browser/browser_gene_results_table.ht"


GROUP_NAMES = hl.literal(
    {
        "Bipolar Disorder": "bipolar_disorder",
        "Bipolar Disorder 1": "bipolar_disorder_1",
        "Bipolar Disorder 2": "bipolar_disorder_2",
        "Bipolar Disorder with Psychosis": "bipolar_disorder_with_psychosis",
        "Bipolar Disorder without Psychosis": "bipolar_disorder_without_psychosis",
        "Bipolar Disorder (including Schizoaffective)": "bipolar_disorder_including_schizoaffective",
    }
)


def prepare_gene_results(gene_results_url, genes_url=None):
    results = hl.read_table(gene_results_url)

    results = results.select(
        "gene_id",
        "gene_description",
        "analysis_group",
        "case_count",
        "control_count",
        "n_cases",
        "n_controls",
        "fisher_log_pval",
        "fisher_gnom_non_psych_log_pval",
        "CMH_log_pval",
        "CMH_gnom_non_psych_log_pval",
    )

    # Rename analysis groups to be Elasticsearch-friendly
    results = results.annotate(analysis_group=GROUP_NAMES[results.analysis_group])

    final_results = None

    consequence_categories = results.aggregate(hl.agg.collect_as_set(results.consequence_category))
    per_category_fields = [
        "case_count",
        "control_count",
        "fisher_log_pval",
        "fisher_gnom_non_psych_log_pval",
        "CMH_log_pval",
        "CMH_gnom_non_psych_log_pval",
    ]
    for category in consequence_categories:
        category_results = results.filter(results.consequence_category == category)
        category_results = category_results.key_by("gene_id", "analysis_group")
        category_results = category_results.select(
            gene_name=category_results.gene_symbol,
            gene_description=category_results.gene_description,
            n_cases=category_results.n_cases,
            n_controls=category_results.n_controls,
            **{f"{category}_{field}": category_results[field] for field in per_category_fields},
        )

        if final_results:
            final_results = final_results.join(
                category_results.select_globals().drop("gene_name", "gene_description", "n_cases", "n_controls"),
                "outer",
            )
        else:
            final_results = category_results

    if genes_url:
        genes = hl.read_table(genes_url)
        genes = genes.key_by("gene_id")
        final_results = final_results.annotate(
            chrom=genes[final_results.gene_id].chrom, pos=genes[final_results.gene_id].start
        )

    return final_results


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
