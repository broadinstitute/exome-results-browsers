import hail as hl

from data_pipeline.config import pipeline_config


def prepare_gene_results():
    ds = hl.read_table(pipeline_config.get("SCHEMA", "gene_results_path"))
    ds = ds.key_by("gene_id")

    ds = ds.drop("gene_name", "gene_description")

    ds = ds.select(
        group_results=hl.dict([("meta", hl.struct(**{field: ds[field] for field in ds.row_value.dtype.fields}))])
    )

    return ds
