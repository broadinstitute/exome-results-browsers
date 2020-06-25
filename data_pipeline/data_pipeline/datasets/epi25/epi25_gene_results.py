import hail as hl

from data_pipeline.config import pipeline_config


def prepare_gene_results():
    ds = hl.import_table(
        pipeline_config.get("Epi25", "gene_results_path"),
        delimiter=",",
        missing="NA",
        quote='"',
        types={
            "gene_id": hl.tstr,
            "gene_name": hl.tstr,
            "description": hl.tstr,
            "pval_meta": hl.tfloat,
            "analysis_group": hl.tstr,
            # LoF
            "xcase_lof": hl.tint,
            "xctrl_lof": hl.tint,
            "pval_lof": hl.tfloat,
            # MPC
            "xcase_mpc": hl.tint,
            "xctrl_mpc": hl.tint,
            "pval_mpc": hl.tfloat,
            # Inframe indel
            "xcase_infrIndel": hl.tint,
            "xctrl_infrIndel": hl.tint,
            "pval_infrIndel": hl.tfloat,
        },
    )

    ds = ds.drop("gene_name", "description")

    # Rename EE group to DEE
    ds = ds.annotate(analysis_group=hl.if_else(ds.analysis_group == "EE", "DEE", ds.analysis_group))

    # "Meta" p-val was carried over from SCHEMA's data format but isn't descriptive of Epi25
    ds = ds.rename({"pval_meta": "pval"})

    ds = ds.group_by("gene_id").aggregate(group_results=hl.agg.collect(ds.row_value))
    ds = ds.annotate(
        group_results=hl.dict(
            ds.group_results.map(
                lambda group_result: (group_result.analysis_group, group_result.drop("gene_id", "analysis_group"))
            )
        )
    )

    return ds
