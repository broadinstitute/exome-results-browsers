import hail as hl

from data_pipeline.config import pipeline_config


def prepare_variant_results():
    variant_results = hl.import_table(
        pipeline_config.get("Epi25", "variant_results_path"),
        force_bgz=True,
        min_partitions=100,
        key="Variant ID",
        missing="NA",
        types={
            "Variant ID": hl.tstr,
            "AC case": hl.tint,
            "AC control": hl.tint,
            "AF case": hl.tfloat,
            "AF control": hl.tfloat,
            "AN case": hl.tint,
            "AN control": hl.tint,
            "Analysis group": hl.tstr,
            "Estimate": hl.tfloat,
            "I2": hl.tfloat,
            "N denovos": hl.tint,
            "P-value": hl.tfloat,
            "Qp": hl.tfloat,
            "SE": hl.tfloat,
        },
    )

    variant_results = variant_results.rename(
        {
            "AC case": "ac_case",
            "AC control": "ac_ctrl",
            "AF case": "af_case",
            "AF control": "af_ctrl",
            "AN case": "an_case",
            "AN control": "an_ctrl",
            "Analysis group": "analysis_group",
        },
    )

    # Rename "EE" analysis group to "DEE"
    variant_results = variant_results.annotate(
        analysis_group=hl.cond(variant_results.analysis_group == "EE", "DEE", variant_results.analysis_group)
    )

    variant_results = variant_results.drop("af_case", "af_ctrl")

    variant_results = variant_results.group_by("Variant ID").aggregate(
        group_results=hl.agg.collect(variant_results.row_value)
    )
    variant_results = variant_results.annotate(
        group_results=hl.dict(
            variant_results.group_results.map(
                lambda group_result: (group_result.analysis_group, group_result.drop("analysis_group"))
            )
        )
    )

    variant_annotations = hl.import_table(
        pipeline_config.get("Epi25", "variant_annotations_path"),
        force_bgz=True,
        min_partitions=100,
        key="Variant ID",
        missing="NA",
        types={
            "Variant ID": hl.tstr,
            "CADD": hl.tfloat,
            "Comment": hl.tstr,
            "Consequence (canonical)": hl.tstr,
            "Consequence (for analysis)": hl.tstr,
            "Consequence (worst)": hl.tstr,
            "Flags": hl.tstr,
            "Gene ID": hl.tstr,
            "Gene name": hl.tstr,
            "HGVSc (canonical)": hl.tstr,
            "HGVSc": hl.tstr,
            "HGVSp (canonical)": hl.tstr,
            "HGVSp": hl.tstr,
            "In analysis": hl.tbool,
            "MPC": hl.tfloat,
            "Polyphen": hl.tstr,
            "Source": hl.tstr,
            "Transcript ID (canonical)": hl.tstr,
            "Transcript ID(s)": hl.tstr,
        },
    )

    variant_annotations = variant_annotations.rename(
        {
            "CADD": "cadd",
            "Comment": "comment",
            "Consequence (canonical)": "csq_canonical",
            "Consequence (for analysis)": "csq_analysis",
            "Consequence (worst)": "csq_worst",
            "Flags": "flags",
            "Gene ID": "gene_id",
            "Gene name": "gene_name",
            "HGVSc (canonical)": "hgvsc_canonical",
            "HGVSc": "hgvsc",
            "HGVSp (canonical)": "hgvsp_canonical",
            "HGVSp": "hgvsp",
            "In analysis": "in_analysis",
            "MPC": "mpc",
            "Polyphen": "polyphen",
            "Source": "source",
            "Transcript ID (canonical)": "canonical_transcript_id",
            "Transcript ID(s)": "transcript_id",
        }
    )

    variant_annotations = variant_annotations.select(
        "gene_id",
        consequence=variant_annotations.csq_analysis,
        hgvsc=variant_annotations.hgvsc_canonical.split(":")[-1],
        hgvsp=variant_annotations.hgvsp_canonical.split(":")[-1],
        info=hl.struct(
            comment=variant_annotations.comment,
            in_analysis=variant_annotations.in_analysis,
            cadd=variant_annotations.cadd,
            mpc=variant_annotations.mpc,
            polyphen=variant_annotations.polyphen,
        ),
    )

    variants = variant_annotations.annotate(group_results=variant_results[variant_annotations.key].group_results)

    variants = variants.annotate(
        locus=hl.rbind(
            variants["Variant ID"].split(":"), lambda p: hl.locus(p[0], hl.int(p[1]), reference_genome="GRCh37")
        ),
        alleles=hl.rbind(variants["Variant ID"].split(":"), lambda p: [p[2], p[3]]),
    )

    variants = variants.key_by("locus", "alleles")

    return variants
