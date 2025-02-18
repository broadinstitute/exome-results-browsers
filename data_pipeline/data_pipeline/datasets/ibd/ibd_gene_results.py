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
        # variant meta values, for summary table
        variant_p_meta=variant_per_gene_per_group.most_significant_variant.variant_data.P_meta,
        variant_beta_meta=variant_per_gene_per_group.most_significant_variant.variant_data.BETA_meta,
        variant_het_p_meta=variant_per_gene_per_group.most_significant_variant.variant_data.HetP,
        # variant per-cohort values stats, for rendering modal
        variant_p_twist=variant_per_gene_per_group.most_significant_variant.variant_data.P_Twist,
        variant_beta_twist=variant_per_gene_per_group.most_significant_variant.variant_data.BETA_Twist,
        variant_p_nextera=variant_per_gene_per_group.most_significant_variant.variant_data.P_Nextera,
        variant_beta_nextera=variant_per_gene_per_group.most_significant_variant.variant_data.BETA_Nextera,
        variant_p_sanger_wes=variant_per_gene_per_group.most_significant_variant.variant_data.P_Sanger_WES,
        variant_beta_sanger_wes=variant_per_gene_per_group.most_significant_variant.variant_data.BETA_Sanger_WES,
        variant_p_ukbb=variant_per_gene_per_group.most_significant_variant.variant_data.P_UKBB,
        variant_beta_ukbb=variant_per_gene_per_group.most_significant_variant.variant_data.BETA_UKBB,
        variant_p_sanger_wgs=variant_per_gene_per_group.most_significant_variant.variant_data.P_Sanger_WGS,
        variant_beta_sanger_wgs=variant_per_gene_per_group.most_significant_variant.variant_data.BETA_Sanger_WGS,
        variant_p_regeneron=variant_per_gene_per_group.most_significant_variant.variant_data.P_regeneron,
        variant_beta_regeneron=variant_per_gene_per_group.most_significant_variant.variant_data.BETA_regeneron,
        # variant JSON-ified transcript consequences, and other info fields, for rendering modal
        variant_consequence=variant_per_gene_per_group.most_significant_variant.variant_data.consequence,
        variant_hgvsc=variant_per_gene_per_group.most_significant_variant.variant_data.hgvsc,
        variant_hgvsp=variant_per_gene_per_group.most_significant_variant.variant_data.hgvsp,
        variant_cadd=variant_per_gene_per_group.most_significant_variant.variant_data.cadd,
        variant_splice_ai=variant_per_gene_per_group.most_significant_variant.variant_data.splice_ai,
        variant_revel=variant_per_gene_per_group.most_significant_variant.variant_data.revel,
        variant_polyphen=variant_per_gene_per_group.most_significant_variant.variant_data.polyphen,
        variant_sift=variant_per_gene_per_group.most_significant_variant.variant_data.sift,
        variant_transcript_consequences=variant_per_gene_per_group.most_significant_variant.variant_data.transcript_consequences,
    )

    variant_per_gene_per_group = variant_per_gene_per_group.key_by("gene_id", "analysis_group")

    results = results.join(variant_per_gene_per_group, "left")

    # pylint: disable-next=anomalous-backslash-in-string
    # results = results.annotate(burden_test=results.burden_test.replace("\.", "_").replace("\+", "_").lower())
    results = results.annotate(
        consequence_category=results.consequence_category.replace("\.", "_").replace("\+", "_").lower()
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
            variant_ac_case=category_results.variant_ac_case,
            variant_an_case=category_results.variant_an_case,
            variant_af_case=category_results.variant_af_case,
            variant_ac_ctrl=category_results.variant_ac_ctrl,
            variant_an_ctrl=category_results.variant_an_ctrl,
            variant_af_ctrl=category_results.variant_af_ctrl,
            variant_p_meta=category_results.variant_p_meta,
            variant_beta_meta=category_results.variant_beta_meta,
            variant_het_p_meta=category_results.variant_het_p_meta,
            variant_p_twist=category_results.variant_p_twist,
            variant_beta_twist=category_results.variant_beta_twist,
            variant_p_nextera=category_results.variant_p_nextera,
            variant_beta_nextera=category_results.variant_beta_nextera,
            variant_p_sanger_wes=category_results.variant_p_sanger_wgs,
            variant_beta_sanger_wes=category_results.variant_beta_sanger_wgs,
            variant_p_ukbb=category_results.variant_p_ukbb,
            variant_beta_ukbb=category_results.variant_beta_ukbb,
            variant_p_sanger_wgs=category_results.variant_p_sanger_wgs,
            variant_beta_sanger_wgs=category_results.variant_beta_sanger_wgs,
            variant_p_regeneron=category_results.variant_p_regeneron,
            variant_beta_regeneron=category_results.variant_beta_regeneron,
            variant_consequence=category_results.variant_consequence,
            variant_hgvsc=category_results.variant_hgvsc,
            variant_hgvsp=category_results.variant_hgvsp,
            variant_cadd=category_results.variant_cadd,
            variant_splice_ai=category_results.variant_splice_ai,
            variant_revel=category_results.variant_revel,
            variant_polyphen=category_results.variant_polyphen,
            variant_sift=category_results.variant_sift,
            variant_transcript_consequences=category_results.variant_transcript_consequences,
            **{f"{category}_{field}": category_results[field] for field in per_category_fields},
        )

        if final_results:
            final_results = final_results.join(
                category_results.drop(
                    "n_cases",
                    "n_controls",
                    "variant_id",
                    "variant_ac_ctrl",
                    "variant_an_ctrl",
                    "variant_af_ctrl",
                    "variant_ac_case",
                    "variant_an_case",
                    "variant_af_case",
                    "variant_p_meta",
                    "variant_beta_meta",
                    "variant_het_p_meta",
                    "variant_p_twist",
                    "variant_beta_twist",
                    "variant_p_nextera",
                    "variant_beta_nextera",
                    "variant_p_sanger_wes",
                    "variant_beta_sanger_wes",
                    "variant_p_ukbb",
                    "variant_beta_ukbb",
                    "variant_p_sanger_wgs",
                    "variant_beta_sanger_wgs",
                    "variant_p_regeneron",
                    "variant_beta_regeneron",
                    "variant_consequence",
                    "variant_hgvsc",
                    "variant_hgvsp",
                    "variant_cadd",
                    "variant_splice_ai",
                    "variant_revel",
                    "variant_polyphen",
                    "variant_sift",
                    "variant_transcript_consequences",
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
