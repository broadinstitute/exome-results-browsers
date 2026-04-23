import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene(results):
    test_gene_symbols = ["PCSK9", "SETD1A", "SAMD11"]
    test_gene_set = hl.literal(test_gene_symbols)

    results = results.filter(test_gene_set.contains(results["Gene"]))
    return results.persist()


def prepare_gene_results(test_genes, _output_root):
    gene_results = hl.read_table(pipeline_config.get("SCHEMA2", "gene_results_path"))

    if test_genes:
        gene_results = filter_results_table_to_test_gene(gene_results)

    # TK: suggest analyst include this in input file, then pull this number from there
    n_cases = 87_959
    n_controls = 150_587

    gene_results = gene_results.select_globals()
    gene_results = gene_results.annotate(analysis_group="meta")

    gene_results = gene_results.select(
        analysis_group="meta",
        #
        ptv_case_carrier=gene_results["PTV Case Carrier"],  # int32
        ptv_control_carrier=gene_results["PTV Control Carrier"],  # int32
        ptv_p_value=gene_results["PTV Pvalue"],  # float64
        ptv_odds_ratio=gene_results["PTV OR"],  # string
        ptv_n_de_novo=gene_results["N de novo PTV"],  # int32
        #
        ptv_mis_case_carrier=gene_results["PTV + Missense Case Carrier"],  # int32
        ptv_mis_control_carrier=gene_results["PTV + Missense Control Carrier"],  # int32
        ptv_mis_p_value=gene_results["PTV + Missense Pvalue"],  # float64
        ptv_mis_odds_ratio=gene_results["PTV+ Missense OR"],  # string
        ptv_mis_n_de_novo=gene_results["N de novo PTV + Missense"],  # int32
        #
        n_de_novo_p_value=gene_results["de novo Pvalue"],  # float64
        #
        schema_case_control_p_value=gene_results["SCHEMA2 Case-Control Pvalue"],  # float64
        case_control_plus_de_novo_p_value=gene_results["Case-Control + de novo Pvalue"],  # float64
    )

    gene_models_path = "gs://gnomad-v4-data-pipeline/output/genes/gnomad.browser.GRCh38.GENCODEv39.pext.ht"
    gene_models_ht = hl.read_table(gene_models_path)
    gene_model_ht = gene_models_ht.key_by("symbol")

    gene_results = gene_results.annotate(
        gene_id=gene_model_ht[gene_results["Gene"]].gene_id,
        n_cases=n_cases,
        n_controls=n_controls,
    )

    gene_results = gene_results.key_by("gene_id")
    gene_results = gene_results.drop("Gene")

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
