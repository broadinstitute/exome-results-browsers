import hail as hl

from data_pipeline.config import pipeline_config
from data_pipeline.gene_filter_utils import filter_variant_results_to_test_gene_intervals, get_test_gene_intervals

CLASS_SEVERITY_RANK = hl.dict(
    {
        "PTV": 0,
        "Mis2": 1,
        "Mis1": 2,
        "Mis0": 3,
        "synonymous": 4,
    }
)

VARIANT_RESULTS_FIELDS = {
    "Variant": ("variant", hl.tstr),
    "Gene": ("gene_name", hl.tstr),
    "Gene ID": ("gene_id", hl.tstr),
    "HGVSp": ("hgvsp", hl.tstr),
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
        pipeline_config.get("ASC2", "variant_results_path"),
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
            ds, get_test_gene_intervals("ASC2", pipeline_config.get("ASC2", "test_genes"))
        )

    ds = ds.rename({raw_name: new_name for raw_name, (new_name, _) in VARIANT_RESULTS_FIELDS.items()})

    ds = ds.drop("variant")

    # NOTE: ~20 variants are duplicated by locus/allele, differing in
    # id and vep consequence, keep only most severe row for now and ask analyst
    ds = ds.group_by("locus", "alleles").aggregate(
        most_severe_row=hl.agg.take(ds.row_value, 1, ordering=CLASS_SEVERITY_RANK.get(ds.variant_class, 99))[0]
    )
    ds = ds.transmute(**{field: ds.most_severe_row[field] for field in ds.most_severe_row.dtype.fields})

    ds = ds.annotate(
        info=hl.struct(
            mpc=ds.mpc,
            alpha_missense=ds.alpha_missense,
            is_other_splice=ds.is_other_splice,
            gnomad_af=ds.gnomad_af,
            transcript_id=ds.transcript_id,
            variant_class=ds.variant_class,
        ),
        # not included in handoff table, required in validation
        hgvsc=hl.missing(hl.tstr),
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
