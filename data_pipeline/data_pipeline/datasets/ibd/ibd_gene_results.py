import os

import hail as hl

from data_pipeline.config import pipeline_config


def prepare_gene_results():
    staging_output_path = pipeline_config.get("output", "staging_path")

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

    results = results.key_by("gene_id", "analysis_group")

    # annotate most significant variant per analysis group onto gene table
    variant_per_gene_per_group = hl.read_table(
        os.path.join(staging_output_path, "ibd", "gene_most_significant_variant_per_analysis_group.ht")
    )
    variant_per_gene_per_group = variant_per_gene_per_group.key_by()

    variant_per_gene_per_group = variant_per_gene_per_group.select(
        gene_id=variant_per_gene_per_group.gene_id,
        analysis_group=variant_per_gene_per_group.group_name.lower(),
        variant_id=variant_per_gene_per_group.most_significant_variant.variant_data.variantID,
        variant_ac_case=variant_per_gene_per_group.most_significant_variant.variant_data.ac_case,
        variant_an_case=variant_per_gene_per_group.most_significant_variant.variant_data.an_case,
        variant_af_case=hl.float(variant_per_gene_per_group.most_significant_variant.variant_data.ac_case)
        / hl.float(variant_per_gene_per_group.most_significant_variant.variant_data.an_case),
        variant_ac_ctrl=variant_per_gene_per_group.most_significant_variant.variant_data.ac_ctrl,
        variant_an_ctrl=variant_per_gene_per_group.most_significant_variant.variant_data.an_ctrl,
        variant_af_ctrl=hl.float(variant_per_gene_per_group.most_significant_variant.variant_data.ac_ctrl)
        / hl.float(variant_per_gene_per_group.most_significant_variant.variant_data.an_ctrl),
        variant_ac_control=variant_per_gene_per_group.most_significant_variant.variant_data.an_control,
        variant_beta=variant_per_gene_per_group.most_significant_variant.variant_data.beta,
        variant_chi_sq_stat=variant_per_gene_per_group.most_significant_variant.variant_data.chi_sq_stat,
        variant_p=variant_per_gene_per_group.most_significant_variant.variant_data.p,
    )

    variant_per_gene_per_group = variant_per_gene_per_group.key_by("gene_id", "analysis_group")

    results = results.join(variant_per_gene_per_group, "left")

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
            variant_id=category_results.variant_id,
            variant_ac_case=category_results.variant_ac_case,
            variant_an_case=category_results.variant_an_case,
            variant_af_case=category_results.variant_af_case,
            variant_ac_ctrl=category_results.variant_ac_ctrl,
            variant_ac_control=category_results.variant_ac_control,
            variant_an_ctrl=category_results.variant_an_ctrl,
            variant_af_ctrl=category_results.variant_af_ctrl,
            variant_beta=category_results.variant_beta,
            variant_chi_sq_stat=category_results.variant_chi_sq_stat,
            variant_p=category_results.variant_p,
            **{f"{category}_{field}": category_results[field] for field in per_category_fields},
        )

        if final_results:
            final_results = final_results.join(
                category_results.drop(
                    "n_cases",
                    "n_controls",
                    "variant_id",
                    "variant_ac_case",
                    "variant_ac_ctrl",
                    "variant_an_case",
                    "variant_an_ctrl",
                    "variant_af_case",
                    "variant_af_ctrl",
                    "variant_ac_control",
                    "variant_beta",
                    "variant_chi_sq_stat",
                    "variant_p",
                ),
                "outer",
            )

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
                    lambda group_result: (
                        hl.switch(group_result.analysis_group)
                        .when("ibd", "IBD")
                        .when("cd", "CD")
                        .when("uc", "UC")
                        .or_missing(),
                        group_result.drop("analysis_group"),
                    )
                )
            )
        )

    return final_results
