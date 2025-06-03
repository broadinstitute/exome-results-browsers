# TK: until we get actualy GP2 gene data,
#   this is a straight up copypasta of the Epi25 data pipeline
#   including using Epi25 as the data source
#
# We need gene data for this project to work as is, so this is a temporary measure

import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene(results, test_gene_symbol):
    results = results.filter(results.gene_symbol == test_gene_symbol)

    return results.persist()


def prepare_gene_results(test_gene_id, _output_root):
    results = hl.read_table(pipeline_config.get("Epi25", "gene_results_path"))

    if test_gene_id:
        results = filter_results_table_to_test_gene(results, test_gene_id)

    results = results.select_globals()

    # Select result fields, discard gene information
    results = results.select(
        "gene_id",
        "analysis_group",
        "case_count",
        "control_count",
        "n_cases",
        "n_controls",
        "pval",
        "OR",
    )

    results = results.annotate(OR=hl.float(results.OR))

    # Rename EE group to DEE
    results = results.annotate(analysis_group=hl.if_else(results.analysis_group == "EE", "DEE", results.analysis_group))

    final_results = None

    consequence_categories = results.aggregate(hl.agg.collect_as_set(results.consequence_category))
    per_category_fields = [
        "case_count",
        "control_count",
        "pval",
        "OR",
    ]
    for category in consequence_categories:
        category_results = results.filter(results.consequence_category == category)
        category_results = category_results.key_by("gene_id", "analysis_group")
        category_results = category_results.select(
            n_cases=category_results.n_cases,
            n_controls=category_results.n_controls,
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
