import hail as hl

from data_pipeline.config import pipeline_config
<<<<<<< HEAD
from data_pipeline.gene_filter_utils import filter_gene_results_to_test_genes
=======
from data_pipeline.gene_filter_utils import filter_gene_results_to_test_genes, parse_test_genes


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
    query_symbol = results["gene_symbol"].upper()

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


fields_to_select = {
    "ptv_case_carrier": "PTV Case Carrier",  # int32
    "ptv_control_carrier": "PTV Control Carrier",  # int32
    "ptv_p_value": "PTV Pvalue",  # float64
    "ptv_odds_ratio": "PTV OR",  # string
    "ptv_odds_ratio_95_ci": "PTV OR 95% CI",  # string, e.g. "0.62 - 2.39"
    "ptv_n_de_novo": "N de novo PTV",  # int32
    #
    "ptv_mis_case_carrier": "PTV + Missense Case Carrier",  # int32
    "ptv_mis_control_carrier": "PTV + Missense Control Carrier",  # int32
    "ptv_mis_p_value": "PTV + Missense Pvalue",  # float64
    "ptv_mis_odds_ratio": "PTV+ Missense OR",  # string
    "ptv_mis_odds_ratio_95_ci": "PTV+ Missense OR 95% CI",  # string, e.g. "0.62 - 2.39"
    "ptv_mis_n_de_novo": "N de novo PTV + Missense",  # int32
    #
    "mis_case_carrier": "Missense Case Carrier",  # int32
    "mis_control_carrier": "Missense Control Carrier",  # int32
    "mis_p_value": "Missense Pvalue",  # float64
    "mis_odds_ratio": "Missense OR",  # string
    "mis_odds_ratio_95_ci": "Missense OR 95% CI",  # string, e.g. "0.62 - 2.39"
    #
    "syn_case_carrier": "Synonymous Case Carrier",  # int32
    "syn_control_carrier": "Synonymous Control Carrier",  # int32
    "syn_p_value": "Synonymous Pvalue",  # float64
    "syn_odds_ratio": "Synonymous OR",  # string
    "syn_odds_ratio_95_ci": "Synonymous OR 95% CI",  # string, e.g. "0.62 - 2.39"
    #
    "n_de_novo_p_value": "de novo Pvalue",  # float64
    #
    "schema_case_control_p_value": "SCHEMA2 Case-Control Pvalue",  # float64h
    "case_control_plus_de_novo_p_value": "Case-Control + de novo Pvalue",  # float64
}
>>>>>>> 27039f863e5e213f1eb717a7b662cf3b3ab33268


def prepare_gene_results(test_genes, _output_root):
    gene_results = hl.read_table(pipeline_config.get("SCHEMA", "gene_results_path"))

    gene_results = gene_results.annotate(gene_symbol=gene_results["Gene"])
    gene_results = gene_results.key_by()
    gene_results = gene_results.key_by("gene_symbol")
    gene_results = gene_results.drop("Gene")

    if test_genes:
<<<<<<< HEAD
        ds = filter_gene_results_to_test_genes(
            ds, "Gene Symbol", pipeline_config.get("SCHEMA", "test_genes").split(",")
        )

    # Parse upper and lower bounds out of odds ratio columns
    def _parse_odds_ratio(field_name):
        return hl.rbind(
            ds[field_name].split(" ", n=2),
            lambda parts: hl.rbind(
                parts[0],
                parts[1][1:-1].split("-", 2),
                lambda value, bounds: hl.struct(
                    **{
                        field_name: hl.float(value),
                        field_name + " lower bound": hl.float(bounds[0]),
                        field_name + " upper bound": hl.float(bounds[1]),
                    }
                ),
            ),
=======
        gene_results = filter_gene_results_to_test_genes(
            gene_results, "gene_symbol", parse_test_genes(pipeline_config.get("SCHEMA", "test_genes"))
>>>>>>> 27039f863e5e213f1eb717a7b662cf3b3ab33268
        )

    # TK: suggest analyst include this in input file, then pull this number from there
    n_cases = 87_959
    n_controls = 150_587

    gene_results = gene_results.select_globals()
    gene_results = gene_results.annotate(analysis_group="meta")

    gene_results = gene_results.select(
        analysis_group="meta", **{name: gene_results[source] for name, source in fields_to_select.items()}
    )

    gene_models_path = "gs://gnomad-v4-data-pipeline/output/genes/gnomad.browser.GRCh38.GENCODEv39.pext.ht"
    gene_models_ht = hl.read_table(gene_models_path)

    primary_lookup_ht = gene_models_ht.key_by("symbol_upper_case").select("gene_id")
    secondary_lookup_ht = build_gene_lookup_ht(gene_models_ht)

    gene_results = map_gene_symbols_to_ensg_ids(gene_results, primary_lookup_ht, secondary_lookup_ht)

    gene_results = gene_results.annotate(
        n_cases=n_cases,
        n_controls=n_controls,
    )

    gene_results = gene_results.group_by("gene_id").aggregate(
        group_results=hl.agg.collect(gene_results.row.drop("gene_id"))
    )
    gene_results = gene_results.annotate(
        group_results=hl.dict(
            gene_results.group_results.map(
                lambda group_result: (group_result.analysis_group, group_result.drop("analysis_group"))
            )
        )
    )

    return gene_results
