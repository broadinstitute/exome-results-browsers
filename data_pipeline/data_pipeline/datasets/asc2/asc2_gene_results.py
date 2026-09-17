import hail as hl

from data_pipeline.config import pipeline_config
from data_pipeline.gene_filter_utils import filter_gene_results_to_test_genes, parse_test_genes

GENE_RESULTS_ANALYSIS_GROUP = "meta"

GENE_RESULTS_FIELDS = {
    "Gene": ("gene_symbol", hl.tstr),
    "EnsemblID": ("gene_id", hl.tstr),
    "Bayes Factor": ("bayes_factor", hl.tfloat),
    "FDR": ("false_discovery_rate", hl.tfloat),
    "FLAG": ("qc_flagged", hl.tbool),
    "de novo PTV proband": ("de_novo_ptv_proband", hl.tint),
    "de novo PTV sibling": ("de_novo_ptv_sibling", hl.tint),
    "de novo Mis2 proband": ("de_novo_mis2_proband", hl.tint),
    "de novo Mis2 sibling": ("de_novo_mis2_sibling", hl.tint),
    "de novo Mis1 proband": ("de_novo_mis1_proband", hl.tint),
    "de novo Mis1 sibling": ("de_novo_mis1_sibling", hl.tint),
    "de novo Mis0 proband": ("de_novo_mis0_proband", hl.tint),
    "de novo Mis0 sibling": ("de_novo_mis0_sibling", hl.tint),
    "de novo SYN proband": ("de_novo_syn_proband", hl.tint),
    "de novo SYN sibling": ("de_novo_syn_sibling", hl.tint),
    "de novo DEL proband": ("de_novo_del_proband", hl.tint),
    "de novo DEL sibling": ("de_novo_del_sibling", hl.tint),
    "de novo DUP proband": ("de_novo_dup_proband", hl.tint),
    "de novo DUP sibling": ("de_novo_dup_sibling", hl.tint),
    "transmitted PTV proband": ("transmitted_ptv_proband", hl.tint),
    "untransmitted PTV proband": ("untransmitted_ptv_proband", hl.tint),
    "transmitted Mis2 proband": ("transmitted_mis2_proband", hl.tint),
    "untransmitted Mis2 proband": ("untransmitted_mis2_proband", hl.tint),
    "transmitted Mis1 proband": ("transmitted_mis1_proband", hl.tint),
    "untransmitted Mis1 proband": ("untransmitted_mis1_proband", hl.tint),
    "transmitted Mis0 proband": ("transmitted_mis0_proband", hl.tint),
    "untransmitted Mis0 proband": ("untransmitted_mis0_proband", hl.tint),
    "transmitted SYN proband": ("transmitted_syn_proband", hl.tint),
    "untransmitted SYN proband": ("untransmitted_syn_proband", hl.tint),
    "transmitted DEL proband": ("transmitted_del_proband", hl.tint),
    "untransmitted DEL proband": ("untransmitted_del_proband", hl.tint),
    "transmitted DUP proband": ("transmitted_dup_proband", hl.tint),
    "untransmitted DUP proband": ("untransmitted_dup_proband", hl.tint),
    "PTV case": ("ptv_case", hl.tint),
    "PTV control": ("ptv_control", hl.tint),
    "Mis2 case": ("mis2_case", hl.tint),
    "Mis2 control": ("mis2_control", hl.tint),
    "Mis1 case": ("mis1_case", hl.tint),
    "Mis1 control": ("mis1_control", hl.tint),
    "Mis0 case": ("mis0_case", hl.tint),
    "Mis0 control": ("mis0_control", hl.tint),
    "SYN case": ("syn_case", hl.tint),
    "SYN control": ("syn_control", hl.tint),
    "DEL case": ("del_case", hl.tint),
    "DEL control": ("del_control", hl.tint),
    "DUP case": ("dup_case", hl.tint),
    "DUP control": ("dup_control", hl.tint),
}


def prepare_gene_results(test_genes, _output_root):
    ds = hl.import_table(
        pipeline_config.get("ASC2", "gene_results_path"),
        force=True,
        missing="",
        types={raw_name: field_type for raw_name, (_, field_type) in GENE_RESULTS_FIELDS.items()},
    )

    ds = ds.rename({raw_name: new_name for raw_name, (new_name, _) in GENE_RESULTS_FIELDS.items()})

    if test_genes:
        ds = filter_gene_results_to_test_genes(
            ds, "gene_symbol", parse_test_genes(pipeline_config.get("ASC2", "test_genes"))
        )

    ds = ds.key_by("gene_id")
    ds = ds.drop("gene_symbol")

    ds = ds.annotate(group_results=hl.dict([(GENE_RESULTS_ANALYSIS_GROUP, ds.row_value)]))
    ds = ds.select("group_results")

    return ds
