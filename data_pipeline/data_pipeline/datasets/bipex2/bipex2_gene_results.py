import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene(results):
    test_gene_symbols = [
        "PCSK9",  # ENSG00000169174
        "AKAP11",  # ENSG00000023516
        "SHANK1",  # ENSG00000161681
        "FRYL",  # ENSG00000075539
        "MAGI2",  # ENSG00000187391
        "KIAA1211L",  # ENSG00000196872
        "C1orf61",  # ENSG00000125462
    ]

    test_gene_symbols = [gene.upper() for gene in test_gene_symbols]
    test_gene_set = hl.literal(test_gene_symbols)

    results = results.filter(test_gene_set.contains(results.gene_symbol.upper()))

    return results.persist()


def annotate_false_discovery_rate_significant_genes(results):

    # p-value of 0 typically indicates error of NaN in analysis, not real
    #    significance
    valid_results = results.filter(hl.is_defined(results["PTV+MIS P-value"]) & (results["PTV+MIS P-value"] > 0))

    bonferonni_significant_cutoff = 13
    # fdr: false discovery rate
    fdr_five_significant_cutoff = 33

    fdr_five_significant_rows = valid_results.order_by("PTV+MIS P-value").take(fdr_five_significant_cutoff)
    fdr_five_significant_gene_symbols = [row.gene_symbol for row in fdr_five_significant_rows]

    bonferonni_significant_gene_symbols = fdr_five_significant_gene_symbols[:bonferonni_significant_cutoff]
    fdr_five_significant_gene_symbols = fdr_five_significant_gene_symbols[:fdr_five_significant_cutoff]

    bonferroni_significant_set = set(bonferonni_significant_gene_symbols)
    hl_bonferroni_significant_set = hl.literal(bonferroni_significant_set)

    fdr_five_significant_set = set(fdr_five_significant_gene_symbols)
    hl_fdr_five_significant_set = hl.literal(fdr_five_significant_set)

    results = results.annotate(
        flags=hl.array(
            [
                hl.or_missing(hl_bonferroni_significant_set.contains(results.gene_symbol), "bonferonni_significant"),
                hl.or_missing(
                    hl_fdr_five_significant_set.contains(results.gene_symbol), "fdr_five_percent_significant"
                ),
            ]
        ).filter(hl.is_defined)
    )

    # turn array ["a", "b", "c"] in to string "a,b,c"
    results = results.transmute(flags=hl.delimit(results.flags, ","))

    return results


def build_gene_lookup_ht(gene_models_ht):
    lookup_ht = gene_models_ht.select(
        search_terms_upper=hl.array(gene_models_ht.search_terms).map(lambda x: x.upper()),
        primary_symbol=gene_models_ht.symbol,
    )

    lookup_ht = lookup_ht.explode("search_terms_upper")

    lookup_ht = lookup_ht.key_by(search_term=lookup_ht.search_terms_upper)

    lookup_ht = lookup_ht.group_by("search_term").aggregate(
        mapped_genes=hl.agg.collect(hl.struct(gene_id=lookup_ht.gene_id, primary_symbol=lookup_ht.primary_symbol))
    )

    return lookup_ht


def map_gene_symbols_to_ensg_ids(results, primary_lookup_ht, secondary_lookup_ht):
    query_symbol = results.gene_symbol.upper()

    primary_match = primary_lookup_ht[query_symbol]
    secondary_match = secondary_lookup_ht[query_symbol]

    results = results.annotate(
        gene_id=hl.case()
        .when(hl.is_defined(primary_match), primary_match.gene_id)
        .when(
            hl.is_defined(secondary_match) & (hl.len(secondary_match.mapped_genes) > 0),
            secondary_match.mapped_genes[0].gene_id,
        )
        .default(hl.null(hl.tstr)),
    )

    return results


def prepare_gene_results(test_genes, _output_root):
    results = hl.read_table(pipeline_config.get("BipEx2", "gene_results_path"))

    results = annotate_false_discovery_rate_significant_genes(results)

    if test_genes:
        results = filter_results_table_to_test_gene(results)

    n_cases = hl.eval(results.globals["case_total"])
    n_controls = hl.eval(results.globals["control_total"])
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
        #
        flags=results["flags"],
    )

    gene_models_path = "gs://gnomad-v4-data-pipeline/output/genes/gnomad.browser.GRCh38.GENCODEv39.pext.ht"
    gene_models_ht = hl.read_table(gene_models_path)

    primary_lookup_ht = gene_models_ht.key_by("symbol_upper_case").select("gene_id")
    secondary_lookup_ht = build_gene_lookup_ht(gene_models_ht)

    results = map_gene_symbols_to_ensg_ids(results, primary_lookup_ht, secondary_lookup_ht)

    results = results.annotate(
        n_cases=n_cases,
        n_controls=n_controls,
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
