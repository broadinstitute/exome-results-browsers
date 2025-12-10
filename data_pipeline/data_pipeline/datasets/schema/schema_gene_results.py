import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene(results):
    test_gene_symbols = ["PCSK9", "SETD1A"]
    test_gene_set = hl.literal(test_gene_symbols)

    results = results.filter(test_gene_set.contains(results["Gene"]))
    return results.persist()


def prepare_gene_results(test_genes, _output_root):
    gene_results = hl.read_table(pipeline_config.get("SCHEMA", "gene_results_path"))

    if test_genes:
        gene_results = filter_results_table_to_test_gene(gene_results)

    gene_models_path = "gs://gnomad-v4-data-pipeline/output/genes/gnomad.browser.GRCh38.GENCODEv39.pext.ht"
    gene_models_ht = hl.read_table(gene_models_path)
    gene_model_ht = gene_models_ht.key_by("symbol")

    gene_results = gene_results.annotate(
        gene_id=gene_model_ht[gene_results["Gene"]].gene_id,
        # FIXME: suggest anlyst include this in input file, remove this when they do
        n_cases=87_959,
        n_controls=150_587,
    )

    gene_results = gene_results.key_by("gene_id")
    gene_results = gene_results.drop("Gene")

    gene_results = gene_results.select(
        group_results=hl.dict(
            [("meta", hl.struct(**{field: gene_results[field] for field in gene_results.row_value.dtype.fields}))]
        )
    )

    return gene_results
