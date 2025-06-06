import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene(results):
    test_gene_symbols = ["PCSK9", "CHD8"]
    test_gene_set = hl.literal(test_gene_symbols)

    results = results.filter(test_gene_set.contains(results.gene_name))
    return results.persist()


def prepare_gene_results(test_genes, _output_root):
    ds = hl.import_table(
        pipeline_config.get("ASC", "gene_results_path"),
        missing="",
        types={
            "gene_name": hl.tstr,
            "gene_id": hl.tstr,
            "description": hl.tstr,
            "analysis_group": hl.tstr,
            "xcase_dn_ptv": hl.tint,
            "xcont_dn_ptv": hl.tint,
            "xcase_dn_misa": hl.tint,
            "xcont_dn_misa": hl.tint,
            "xcase_dn_misb": hl.tint,
            "xcont_dn_misb": hl.tint,
            "xcase_dbs_ptv": hl.tint,
            "xcont_dbs_ptv": hl.tint,
            "xcase_swe_ptv": hl.tint,
            "xcont_swe_ptv": hl.tint,
            "xcase_tut": hl.tint,
            "xcont_tut": hl.tint,
            "qval": hl.tfloat,
        },
    )

    if test_genes:
        ds = filter_results_table_to_test_gene(ds)

    ds = ds.drop("gene_name", "description")

    ds = ds.group_by("gene_id").aggregate(group_results=hl.agg.collect(ds.row_value.drop("gene_id")))
    ds = ds.annotate(
        group_results=hl.dict(
            ds.group_results.map(
                lambda group_result: (group_result.analysis_group, group_result.drop("analysis_group"))
            )
        )
    )

    return ds
