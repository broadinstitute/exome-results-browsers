import hail as hl

from data_pipeline.config import pipeline_config
from data_pipeline.gene_filter_utils import filter_variant_results_to_test_gene_intervals, get_test_gene_intervals

VARIANT_RESULTS_FIELDS = {
    "Variant": ("variant", hl.tstr),
    "Gene": ("gene_name", hl.tstr),
    "Gene ID": ("gene_id", hl.tstr),
    "HGVSp": ("hgvsp", hl.tstr),
    "HGVSc": ("hgvsc", hl.tstr),
    # consequence terms here are different than 'standard' VEP terms
    "Consequence": ("consequence", hl.tstr),
    "Class": ("variant_class", hl.tstr),
    "MPC": ("mpc", hl.tfloat),
    "AM": ("alpha_missense", hl.tfloat),
    "isOS": ("is_other_splice", hl.tbool),
    "gnomAD AF": ("gnomad_af", hl.tfloat),
    "Transcript ID": ("transcript_id", hl.tstr),
    "de novo AC proband": ("de_novo_ac_proband", hl.tint),
    "de novo AC sibling": ("de_novo_ac_sibling", hl.tint),
    "transmitted AC proband": ("transmitted_ac_proband", hl.tint),
    "untransmitted AC proband": ("untransmitted_ac_proband", hl.tint),
    "AC case": ("ac_case", hl.tint),
    "AC control": ("ac_ctrl", hl.tint),
}


def prepare_variant_results(test_genes, _output_root):
    ds = hl.import_table(
        pipeline_config.get("AGB", "variant_results_path"),
        force=True,
        missing="",
        types={raw_name: field_type for raw_name, (_, field_type) in VARIANT_RESULTS_FIELDS.items()},
    )

    def locus_from_variant_parts(variant_parts):
        return hl.locus("chr" + variant_parts[0], hl.int(variant_parts[1]), reference_genome="GRCh38")

    def alleles_from_variant_parts(variant_parts):
        return [variant_parts[2], variant_parts[3]]

    ds = ds.annotate(
        locus=hl.rbind(ds.Variant.split(":"), locus_from_variant_parts),
        alleles=hl.rbind(ds.Variant.split(":"), alleles_from_variant_parts),
    )

    ds = ds.key_by("locus", "alleles")

    if test_genes:
        ds = filter_variant_results_to_test_gene_intervals(
            ds, get_test_gene_intervals("AGB", pipeline_config.get("AGB", "test_genes"))
        )

    ds = ds.rename({raw_name: new_name for raw_name, (new_name, _) in VARIANT_RESULTS_FIELDS.items()})

    ds = ds.drop("variant")

    ds = ds.annotate(
        info=hl.struct(
            mpc=ds.mpc,
            alpha_missense=ds.alpha_missense,
            is_other_splice=ds.is_other_splice,
            gnomad_af=ds.gnomad_af,
            transcript_id=ds.transcript_id,
            variant_class=ds.variant_class,
        ),
    )

    ds = ds.annotate(
        group_results=hl.dict(
            [
                (
                    "meta",
                    hl.struct(
                        de_novo_ac_proband=ds.de_novo_ac_proband,
                        de_novo_ac_sibling=ds.de_novo_ac_sibling,
                        transmitted_ac_proband=ds.transmitted_ac_proband,
                        untransmitted_ac_proband=ds.untransmitted_ac_proband,
                        ac_case=ds.ac_case,
                        ac_ctrl=ds.ac_ctrl,
                    ),
                )
            ]
        )
    )

    ds = ds.key_by("locus", "alleles")
    ds = ds.select("gene_id", "consequence", "hgvsc", "hgvsp", "info", "group_results")

    return ds
