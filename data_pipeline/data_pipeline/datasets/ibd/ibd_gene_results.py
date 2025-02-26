import os

import hail as hl

from data_pipeline.config import pipeline_config


def prepare_gene_results():
    staging_output_path = pipeline_config.get("output", "staging_path")

    results = hl.read_table(pipeline_config.get("IBD", "gene_results_path"))

    results = results.select_globals()

    results = results.annotate(gene_id=results.ensgid)

    # Select result fields, discard gene information
    results = results.select(
        "gene_id",
        "analysis_group",
        "consequence_category",
        "P_meta",
        "beta_meta",
        "N_meta",
        "n_control",
        "het_P_meta",
        "P_Broad_Twist",
        "beta_Broad_Twist",
        "P_Broad_Nextera",
        "beta_Broad_Nextera",
        "P_Sanger_wes",
        "beta_Sanger_wes",
        "P_Sanger_wgs",
        "beta_Sanger_wgs",
        "P_UKBB_wes",
        "beta_UKBB_wes",
    )

    # This specific beta was mistakenly typed as a string in the handoff data
    results = results.annotate(beta_Sanger_wgs=hl.float(results.beta_Sanger_wgs))

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
        variant_af_case=hl.float(variant_per_gene_per_group.most_significant_variant.variant_data.ac_case)
        / hl.float(variant_per_gene_per_group.most_significant_variant.variant_data.an_case),
        variant_af_ctrl=hl.float(variant_per_gene_per_group.most_significant_variant.variant_data.ac_ctrl)
        / hl.float(variant_per_gene_per_group.most_significant_variant.variant_data.an_ctrl),
        # variant meta values, for summary table
        variant_p_meta=variant_per_gene_per_group.most_significant_variant.variant_data.P_meta,
        variant_beta_meta=variant_per_gene_per_group.most_significant_variant.variant_data.BETA_meta,
        variant_het_p_meta=variant_per_gene_per_group.most_significant_variant.variant_data.HetP,
    )

    variant_per_gene_per_group = variant_per_gene_per_group.key_by("gene_id", "analysis_group")

    results = results.join(variant_per_gene_per_group, "left")

    results = results.annotate(
        consequence_category=results.consequence_category.replace(r"\.", "_").replace(r"\+", "_").lower()
    )

    final_results = None

    consequence_categories = results.aggregate(hl.agg.collect_as_set(results.consequence_category))
    per_category_fields = [
        "P_meta",
        "beta_meta",
        "het_P_meta",
        "P_Broad_Twist",
        "beta_Broad_Twist",
        "P_Broad_Nextera",
        "beta_Broad_Nextera",
        "P_Sanger_wes",
        "beta_Sanger_wes",
        "P_Sanger_wgs",
        "beta_Sanger_wgs",
        "P_UKBB_wes",
        "beta_UKBB_wes",
    ]

    for category in consequence_categories:
        category_results = results.filter(results.consequence_category == category)
        category_results = category_results.key_by("gene_id", "analysis_group")
        category_results = category_results.select(
            n_cases=category_results.N_meta,
            n_controls=category_results.n_control,
            variant_id=category_results.variant_id,
            variant_af_case=category_results.variant_af_case,
            variant_af_ctrl=category_results.variant_af_ctrl,
            variant_p_meta=category_results.variant_p_meta,
            variant_beta_meta=category_results.variant_beta_meta,
            variant_het_p_meta=category_results.variant_het_p_meta,
            **{f"{category}_{field}": category_results[field] for field in per_category_fields},
        )

        if final_results:
            final_results = final_results.join(
                category_results.drop(
                    "n_cases",
                    "n_controls",
                    "variant_id",
                    "variant_af_ctrl",
                    "variant_af_case",
                    "variant_p_meta",
                    "variant_beta_meta",
                    "variant_het_p_meta",
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
