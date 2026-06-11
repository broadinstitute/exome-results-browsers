import hail as hl

from data_pipeline.config import pipeline_config


def filter_clinvar_table_to_test_gene_interval(ht_clinvar):

    # ENSG00000169174
    pcsk9_interval = hl.locus_interval(
        "chr1", 55039447, 55064852, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    # ENSG00000177628
    gba1_interval = hl.locus_interval(
        "chr1", 155234452, 155244699, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    # ENSG00000177663
    il17ra_interval = hl.locus_interval(
        "chr22", 17084954, 17115694, reference_genome="GRCh38", includes_start=True, includes_end=True
    )

    ht_clinvar = hl.filter_intervals(ht_clinvar, [pcsk9_interval, gba1_interval, il17ra_interval])

    return ht_clinvar


def prepare_clinvar_variants(test_genes):

    # TK: TODO: this is currently GeniE reduced ClinVar, is that good enough?
    #   should I copy gnomAD clinvar proper? I have a really good ClinVar table
    #   imo
    ht_clinvar = hl.read_table(pipeline_config.get("reference_data", "clinvar_grch38_path"))

    if test_genes:
        ht_clinvar = filter_clinvar_table_to_test_gene_interval(ht_clinvar)

    # munge the data!

    return ht_clinvar
