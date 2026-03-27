import hail as hl

from data_pipeline.config import pipeline_config


def filter_results_table_to_test_gene(results):
    test_gene_symbols = ["PCSK9", "SETD1A"]
    test_gene_set = hl.literal(test_gene_symbols)

    results = results.filter(test_gene_set.contains(results["Gene Symbol"]))
    return results.persist()


def prepare_gene_results(test_genes, _output_root):
    ds = hl.import_table(
        pipeline_config.get("SCHEMA", "gene_results_path"),
        delimiter="\t",
        missing="NA",
        types={
            "Gene ID": hl.tstr,
            "Gene Symbol": hl.tstr,
            "Gene Name": hl.tstr,
            "Case PTV": hl.tint,
            "Ctrl PTV": hl.tint,
            "Case mis3": hl.tint,
            "Ctrl mis3": hl.tint,
            "Case mis2": hl.tint,
            "Ctrl mis2": hl.tint,
            "P ca/co (Class 1)": hl.tfloat,
            "P ca/co (Class 2)": hl.tfloat,
            "P ca/co (comb)": hl.tfloat,
            "De novo PTV": hl.tint,
            "De novo mis3": hl.tint,
            "De novo mis2": hl.tint,
            "P de novo": hl.tfloat,
            "P meta": hl.tfloat,
            "Q meta": hl.tfloat,
            "OR (PTV)": hl.tstr,
            "OR (Class I)": hl.tstr,
            "OR (Class II)": hl.tstr,
        },
    )

    if test_genes:
        ds = filter_results_table_to_test_gene(ds)

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
        )

    ds = ds.transmute(**_parse_odds_ratio("OR (PTV)"))
    ds = ds.transmute(**_parse_odds_ratio("OR (Class I)"))
    ds = ds.transmute(**_parse_odds_ratio("OR (Class II)"))

    ds = ds.drop("Gene Symbol", "Gene Name")

    ds = ds.rename({"Gene ID": "gene_id"})
    ds = ds.key_by("gene_id")

    ds = ds.select(
        group_results=hl.dict([("meta", hl.struct(**{field: ds[field] for field in ds.row_value.dtype.fields}))])
    )

    return ds
