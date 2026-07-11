import hail as hl

from data_pipeline.config import pipeline_config
from data_pipeline.gene_filter_utils import filter_variant_results_to_test_gene_intervals, parse_test_gene_intervals


def prepare_clinvar_variants(test_genes):
    ht_clinvar = hl.read_table(pipeline_config.get("ClinVarGRCh38", "variant_results_path"))

    if test_genes:
        ht_clinvar = filter_variant_results_to_test_gene_intervals(ht_clinvar, parse_test_gene_intervals(pipeline_config.get("ClinVarGRCh38", "test_gene_intervals")))

    def get_best_consequence(csq_array):
        mane_csqs = csq_array.filter(lambda c: c.is_mane_select)
        canonical_csqs = csq_array.filter(lambda c: c.is_canonical)

        return hl.or_else(
            mane_csqs.first(),
            hl.or_else(canonical_csqs.first(), csq_array.first()),  # most severe if no mane_select or canonical
        )

    ht_clinvar = ht_clinvar.annotate(best_csq=get_best_consequence(ht_clinvar.transcript_consequences))

    ht_clinvar = ht_clinvar.annotate(
        transcript_id=ht_clinvar.best_csq.transcript_id,
        major_consequence=ht_clinvar.best_csq.major_consequence,
        hgvsp=ht_clinvar.best_csq.hgvsp,
        hgvsc=ht_clinvar.best_csq.hgvsc,
        gene_id=ht_clinvar.best_csq.gene_id,
        gene_symbol=ht_clinvar.best_csq.gene_symbol,
        consequence="other",
        group_results=hl.dict([("meta", hl.struct())]),
        info=hl.struct(
            gene_id=ht_clinvar.best_csq.gene_id,
            gene_symbol=ht_clinvar.best_csq.gene_symbol,
            clinvar_variation_id=ht_clinvar.clinvar_variation_id,
            rsid=ht_clinvar.rsid,
            review_status=ht_clinvar.review_status,
            gold_stars=ht_clinvar.gold_stars,
            clinical_significance=ht_clinvar.clinical_significance,
            last_evaluated=ht_clinvar.last_evaluated,
            transcript_id=ht_clinvar.best_csq.transcript_id,
            major_consequence=ht_clinvar.best_csq.major_consequence,
        ),
    )

    ht_clinvar = ht_clinvar.select_globals()

    ht_clinvar = ht_clinvar.select(
        # [locus, alleles] from key
        "variant_id",
        "pos",
        "consequence",
        "hgvsc",
        "hgvsp",
        #
        "gene_id",
        "gene_symbol",
        #
        "group_results",
        "info",
    )

    return ht_clinvar
