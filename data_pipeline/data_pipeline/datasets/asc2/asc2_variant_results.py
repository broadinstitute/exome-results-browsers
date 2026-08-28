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


def prepare_variant_results(test_genes, _output_root):
    ds = hl.import_table(
        pipeline_config.get("ASC2", "variant_results_path"),
        force=True,
        missing="",
        types={
            "Variant": hl.tstr,
            "Gene": hl.tstr,
            "Gene ID": hl.tstr,
            "HGVSp": hl.tstr,
            # Raw term vocabulary differs from the VEP terms used elsewhere in this
            # pipeline (e.g. "missense" here vs. "missense_variant" in
            # CONSEQUENCE_TERM_RANKS) -- front end code that expects VEP terms will
            # need a mapping, or the analysts will need to confirm this is meant to
            # replace VEP terms outright.
            "Consequence": hl.tstr,
            "Class": hl.tstr,
            "MPC": hl.tfloat,
            "AM": hl.tfloat,
            "isOS": hl.tbool,
            "gnomAD AF": hl.tfloat,
            "Transcript ID": hl.tstr,
            "de novo AC proband": hl.tint,
            "de novo AC sibling": hl.tint,
            "transmitted AC proband": hl.tint,
            "untransmitted AC proband": hl.tint,
            "AC case": hl.tint,
            "AC control": hl.tint,
        },
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
    ds = ds.drop("Variant")

    if test_genes:
        ds = filter_variant_results_to_test_gene_intervals(
            ds, get_test_gene_intervals("ASC2", pipeline_config.get("ASC2", "test_genes"))
        )

    ds = ds.rename(
        {
            "Gene": "gene_name",
            "Gene ID": "gene_id",
            "HGVSp": "hgvsp",
            "Consequence": "consequence",
            "Class": "variant_class",
            "MPC": "mpc",
            "AM": "alpha_missense",
            "isOS": "is_other_splice",
            "gnomAD AF": "gnomad_af",
            "Transcript ID": "transcript_id",
            "de novo AC proband": "de_novo_ac_proband",
            "de novo AC sibling": "de_novo_ac_sibling",
            "transmitted AC proband": "transmitted_ac_proband",
            "untransmitted AC proband": "untransmitted_ac_proband",
            "AC case": "ac_case",
            "AC control": "ac_ctrl",
        }
    )

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
