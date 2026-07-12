import hail as hl

from data_pipeline.config import pipeline_config
from data_pipeline.gene_filter_utils import filter_variant_results_to_test_gene_intervals, parse_test_gene_intervals


def prepare_variant_results(results, annotations, test_genes, _output_root):
    if test_genes:
        results = filter_variant_results_to_test_gene_intervals(
            results, parse_test_gene_intervals(pipeline_config.get("GP2", "test_gene_intervals"))
        )

    results = results.annotate(
        ac_pd=results.ac_pd[1],
        ac_psp=hl.if_else(hl.is_defined(results.ac_psp), results.ac_psp[1], hl.missing(hl.tint32)),
        ac_dlb=hl.if_else(hl.is_defined(results.ac_dlb), results.ac_dlb[1], hl.missing(hl.tint32)),
        ac_msa=hl.if_else(hl.is_defined(results.ac_msa), results.ac_msa[1], hl.missing(hl.tint32)),
        ac_ctrl=hl.if_else(hl.is_defined(results.ac_ctrl), results.ac_ctrl[1], hl.missing(hl.tint32)),
        ac_other=hl.if_else(hl.is_defined(results.ac_other), results.ac_other[1], hl.missing(hl.tint32)),
    )
    results = results.drop(
        "af_pd",
        "af_psp",
        "af_dlb",
        "af_msa",
        "af_ctrl",
        "af_other",
    )
    results = results.filter(
        (results.ac_pd > 0)
        | (results.ac_psp > 0)
        | (results.ac_dlb > 0)
        | (results.ac_msa > 0)
        | (results.ac_other > 0)
        | (results.ac_ctrl > 0)
    )

    results = results.group_by("locus", "alleles").aggregate(
        group_results=hl.dict(
            hl.agg.group_by(
                results.ancestry,
                hl.agg.group_by(
                    results.dataset,
                    hl.agg.take(
                        hl.struct(
                            ac_pd=results.ac_pd,
                            an_pd=results.an_pd,
                            ac_psp=results.ac_psp,
                            an_psp=results.an_psp,
                            ac_dlb=results.ac_dlb,
                            an_dlb=results.an_dlb,
                            ac_msa=results.ac_msa,
                            an_msa=results.an_msa,
                            ac_ctrl=results.ac_ctrl,
                            an_ctrl=results.an_ctrl,
                            ac_other=results.ac_other,
                            an_other=results.an_other,
                        ),
                        1,
                    ),
                ),
            )
        )
    )

    results = results.annotate(
        group_results=hl.dict(
            hl.map(
                lambda item: (
                    item[0],
                    hl.bind(
                        lambda wgs_stats_array, ces_stats_array: hl.struct(
                            wgs_ac_pd=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_pd, hl.missing(hl.tint32)
                            ),
                            wgs_an_pd=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_pd, hl.missing(hl.tint32)
                            ),
                            wgs_ac_psp=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_psp, hl.missing(hl.tint32)
                            ),
                            wgs_an_psp=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_psp, hl.missing(hl.tint32)
                            ),
                            wgs_ac_dlb=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_dlb, hl.missing(hl.tint32)
                            ),
                            wgs_an_dlb=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_dlb, hl.missing(hl.tint32)
                            ),
                            wgs_ac_msa=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_msa, hl.missing(hl.tint32)
                            ),
                            wgs_an_msa=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_msa, hl.missing(hl.tint32)
                            ),
                            wgs_ac_ctrl=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_ctrl, hl.missing(hl.tint32)
                            ),
                            wgs_an_ctrl=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_ctrl, hl.missing(hl.tint32)
                            ),
                            wgs_ac_other=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].ac_other, hl.missing(hl.tint32)
                            ),
                            wgs_an_other=hl.if_else(
                                hl.len(wgs_stats_array) > 0, wgs_stats_array[0].an_other, hl.missing(hl.tint32)
                            ),
                            ces_ac_pd=hl.if_else(
                                hl.len(ces_stats_array) > 0, ces_stats_array[0].ac_pd, hl.missing(hl.tint32)
                            ),
                            ces_an_pd=hl.if_else(
                                hl.len(ces_stats_array) > 0, ces_stats_array[0].an_pd, hl.missing(hl.tint32)
                            ),
                        ),
                        item[1].get("WGS"),
                        item[1].get("CES"),
                    ),
                ),
                results.group_results.items(),
            )
        )
    )

    variants = results.key_by("locus", "alleles")

    clinvar = hl.read_table(pipeline_config.get("reference_data", "clinvar_grch38_path"))
    clinvar = clinvar.select(
        "clinvar_variation_id",
        "clinical_significance_category",
        clinical_significance=clinvar.clinical_significance[0],
    )
    annotations = annotations.annotate(**clinvar[annotations.locus, annotations.alleles])

    dbSNP_rsids = hl.read_table(pipeline_config.get("reference_data", "dbSNP_grch38_rsids_path"))
    dbSNP_rsids = dbSNP_rsids.select_globals()
    dbSNP_rsids = dbSNP_rsids.select(
        "rsid",
    )
    annotations = annotations.annotate(**dbSNP_rsids[annotations.locus, annotations.alleles])

    annotations = annotations.select(
        "gene_id",
        consequence=annotations.consequence,
        hgvsc=annotations.hgvsc.split(":")[-1],
        hgvsp=annotations.hgvsp.split(":")[-1],
        info=hl.struct(
            cadd=annotations.cadd,
            revel=annotations.revel,
            clinvar_variation_id=annotations.clinvar_variation_id,
            clinical_significance=annotations.clinical_significance,
            clinical_significance_category=annotations.clinical_significance_category,
            rsid=annotations.rsid,
        ),
    )

    variants = variants.annotate(**annotations[variants.locus, variants.alleles])

    return variants
