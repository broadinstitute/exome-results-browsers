import hail as hl

from data_pipeline.config import pipeline_config


def prepare_gene_results():
    results = hl.read_table(pipeline_config.get("IBD", "gene_results_path"))

    results = results.select_globals()

    # Select result fields, discard gene information
    results = results.select(
        "gene_id",
        "analysis_group",
        "burden_test",
        "P",
        "BETA",
        "SE",
        "freq",
        "n_alleles_case",
        "n_alleles_control",
        "n_samples_case",
        "n_samples_control",
        "HetP",
    )

    # pylint: disable-next=anomalous-backslash-in-string
    results = results.annotate(burden_test=results.burden_test.replace("\.", "_").replace("\+", "_").lower())

    final_results = None

    consequence_categories = results.aggregate(hl.agg.collect_as_set(results.burden_test))
    per_category_fields = [
        "P",
        "BETA",
        "SE",
        "freq",
        "n_alleles_case",
        "n_alleles_control",
        "n_samples_case",
        "n_samples_control",
        "HetP",
    ]
    for category in consequence_categories:
        category_results = results.filter(results.burden_test == category)
        category_results = category_results.key_by("gene_id", "analysis_group")
        category_results = category_results.select(
            n_cases=category_results.n_samples_case,
            n_controls=category_results.n_samples_control,
            **{f"{category}_{field}": category_results[field] for field in per_category_fields},
        )

        if final_results:
            final_results = final_results.join(category_results.drop("n_cases", "n_controls"), "outer")

            # N cases/controls should be the same for all consequence categories for a gene/analysis group.
            # However, if there are no variants of a certain consequence category found in a gene, then
            # N cases/controls for that gene/analysis group/consequence category will be missing.
            final_results = final_results.annotate(
                n_cases=hl.or_else(
                    final_results.n_cases, category_results[final_results.gene_id, final_results.analysis_group].n_cases
                ),
                n_controls=hl.or_else(
                    final_results.n_controls,
                    category_results[final_results.gene_id, final_results.analysis_group].n_controls,
                ),
            )
        else:
            final_results = category_results

    if final_results:
        final_results = final_results.group_by("gene_id").aggregate(
            group_results=hl.agg.collect(final_results.row.drop("gene_id"))
        )
        final_results = final_results.annotate(
            group_results=hl.dict(
                final_results.group_results.map(
                    lambda group_result: (group_result.analysis_group, group_result.drop("analysis_group"))
                )
            )
        )

    return final_results
