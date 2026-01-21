import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene(results):
    test_gene_symbols = ["PCSK9", "AKAP11"]
    test_gene_set = hl.literal(test_gene_symbols)

    results = results.filter(test_gene_set.contains(results.gene_symbol))
    return results.persist()


def prepare_gene_results(test_genes, _output_root):
    results = hl.read_table(pipeline_config.get("BipEx", "gene_results_path"))

    if test_genes:
        results = filter_results_table_to_test_gene(results)

    results = results.select_globals()

    results = results.annotate(
        analysis_group="meta",
    )

    # Select result fields, discard gene information
    results = results.select(
        analysis_group="meta",
        syn_case_carrier=results["SYN Case Carrier"],
        syn_ctrl_carrier=results["SYN Control Carrier"],
        syn_p_value=results["SYN P-value"],
        syn_odds_ratio=results["SYN Odds Ratio"],
        mis_case_carrier=results["MIS Case Carrier"],
        mis_ctrl_carrier=results["MIS Control Carrier"],
        mis_p_value=results["MIS P-value"],
        mis_odds_ratio=results["MIS Odds Ratio"],
        ptv_case_carrier=results["PTV Case Carrier"],
        ptv_ctrl_carrier=results["PTV Control Carrier"],
        ptv_p_value=results["PTV P-value"],
        ptv_odds_ratio=results["PTV Odds Ratio"],
        ptv_mis_case_carrier=results["PTV+MIS Case Carrier"],
        ptv_mis_ctrl_carrier=results["PTV+MIS Control Carrier"],
        ptv_mis_p_value=results["PTV+MIS P-value"],
        ptv_mis_odds_ratio=results["PTV+MIS Odds Ratio"],
    )

    gene_models_path = "gs://gnomad-v4-data-pipeline/output/genes/gnomad.browser.GRCh38.GENCODEv39.pext.ht"
    gene_models_ht = hl.read_table(gene_models_path)
    gene_model_ht = gene_models_ht.key_by("symbol")

    results = results.annotate(
        gene_id=gene_model_ht[results["gene_symbol"]].gene_id,
        # FIXME: suggest anlyst include this in input file, remove this when they do
        n_cases=65_018,
        n_controls=169_631,
    )

    results = results.group_by("gene_id").aggregate(group_results=hl.agg.collect(results.row.drop("gene_id")))
    results = results.annotate(
        group_results=hl.dict(
            results.group_results.map(
                lambda group_result: (group_result.analysis_group, group_result.drop("analysis_group"))
            )
        )
    )

    return results
