import hail as hl

from data_pipeline.config import pipeline_config
from data_pipeline.gene_filter_utils import filter_gene_results_to_test_genes, parse_test_genes

GENE_RESULTS_ANALYSIS_GROUP = "meta"


def prepare_gene_results(test_genes, _output_root):
    ds = hl.import_table(
        pipeline_config.get("ASC2", "gene_results_path"),
        force=True,
        missing="",
        types={
            "Gene": hl.tstr,
            "EnsemblID": hl.tstr,
            "Bayes Factor": hl.tfloat,
            "FDR": hl.tfloat,
            "FLAG": hl.tbool,
            "de novo PTV proband": hl.tint,
            "de novo PTV sibling": hl.tint,
            "de novo Mis2 proband": hl.tint,
            "de novo Mis2 sibling": hl.tint,
            "de novo Mis1 proband": hl.tint,
            "de novo Mis1 sibling": hl.tint,
            "de novo DEL proband": hl.tint,
            "de novo DEL sibling": hl.tint,
            "de novo DUP proband": hl.tint,
            "de novo DUP sibling": hl.tint,
            "transmitted PTV proband": hl.tint,
            "untransmitted PTV proband": hl.tint,
            "transmitted Mis2 proband": hl.tint,
            "untransmitted Mis2 proband": hl.tint,
            "transmitted Mis1 proband": hl.tint,
            "untransmitted Mis1 proband": hl.tint,
            "transmitted DEL proband": hl.tint,
            "untransmitted DEL proband": hl.tint,
            "transmitted DUP proband": hl.tint,
            "untransmitted DUP proband": hl.tint,
            "PTV case": hl.tint,
            "PTV control": hl.tint,
            "Mis2 case": hl.tint,
            "Mis2 control": hl.tint,
            "Mis1 case": hl.tint,
            "Mis1 control": hl.tint,
            "DEL case": hl.tint,
            "DEL control": hl.tint,
            "DUP case": hl.tint,
            "DUP control": hl.tint,
        },
    )

    ds = ds.rename(
        {
            "Gene": "gene_symbol",
            "EnsemblID": "gene_id",
            "Bayes Factor": "bayes_factor",
            "FDR": "false_discovery_rate",
            "FLAG": "qc_flagged",
            "de novo PTV proband": "de_novo_ptv_proband",
            "de novo PTV sibling": "de_novo_ptv_sibling",
            "de novo Mis2 proband": "de_novo_mis2_proband",
            "de novo Mis2 sibling": "de_novo_mis2_sibling",
            "de novo Mis1 proband": "de_novo_mis1_proband",
            "de novo Mis1 sibling": "de_novo_mis1_sibling",
            "de novo DEL proband": "de_novo_del_proband",
            "de novo DEL sibling": "de_novo_del_sibling",
            "de novo DUP proband": "de_novo_dup_proband",
            "de novo DUP sibling": "de_novo_dup_sibling",
            "transmitted PTV proband": "transmitted_ptv_proband",
            "untransmitted PTV proband": "untransmitted_ptv_proband",
            "transmitted Mis2 proband": "transmitted_mis2_proband",
            "untransmitted Mis2 proband": "untransmitted_mis2_proband",
            "transmitted Mis1 proband": "transmitted_mis1_proband",
            "untransmitted Mis1 proband": "untransmitted_mis1_proband",
            "transmitted DEL proband": "transmitted_del_proband",
            "untransmitted DEL proband": "untransmitted_del_proband",
            "transmitted DUP proband": "transmitted_dup_proband",
            "untransmitted DUP proband": "untransmitted_dup_proband",
            "PTV case": "ptv_case",
            "PTV control": "ptv_control",
            "Mis2 case": "mis2_case",
            "Mis2 control": "mis2_control",
            "Mis1 case": "mis1_case",
            "Mis1 control": "mis1_control",
            "DEL case": "del_case",
            "DEL control": "del_control",
            "DUP case": "dup_case",
            "DUP control": "dup_control",
        }
    )

    if test_genes:
        ds = filter_gene_results_to_test_genes(
            ds, "gene_symbol", parse_test_genes(pipeline_config.get("ASC2", "test_genes"))
        )

    ds = ds.key_by("gene_id")
    ds = ds.drop("gene_symbol")

    ds = ds.annotate(group_results=hl.dict([(GENE_RESULTS_ANALYSIS_GROUP, ds.row_value)]))
    ds = ds.select("group_results")

    return ds
