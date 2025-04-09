import argparse
import os
import sys

import hail as hl

from data_pipeline.config import pipeline_config


def get_exons(gencode):
    """
    Filter Gencode table to exons and format fields.
    """
    exons = gencode.filter(hl.set(["exon", "CDS", "UTR"]).contains(gencode.feature))
    exons = exons.select(
        feature_type=exons.feature,
        transcript_id=exons.transcript_id.split("\\.")[0],
        gene_id=exons.gene_id.split("\\.")[0],
        chrom=exons.interval.start.contig.replace("^chr", ""),
        strand=exons.strand,
        start=exons.interval.start.position,
        stop=exons.interval.end.position,
    )

    return exons


def get_genes(gencode):
    """
    Filter Gencode table to genes and format fields.
    """
    genes = gencode.filter(gencode.feature == "gene")
    genes = genes.select(
        gene_id=genes.gene_id.split("\\.")[0],
        gene_symbol=genes.gene_name,
        chrom=genes.interval.start.contig.replace("^chr", ""),
        strand=genes.strand,
        start=genes.interval.start.position,
        stop=genes.interval.end.position,
    )

    genes = genes.key_by(genes.gene_id).drop("interval")

    return genes


def get_transcripts(gencode):
    """
    Filter Gencode table to transcripts and format fields.
    """
    transcripts = gencode.filter(gencode.feature == "transcript")
    transcripts = transcripts.select(
        transcript_id=transcripts.transcript_id.split("\\.")[0],
        gene_id=transcripts.gene_id.split("\\.")[0],
        chrom=transcripts.interval.start.contig.replace("^chr", ""),
        strand=transcripts.strand,
        start=transcripts.interval.start.position,
        stop=transcripts.interval.end.position,
    )

    transcripts = transcripts.key_by(transcripts.transcript_id).drop("interval")

    return transcripts


def load_gencode_gene_models(gtf_path, reference_genome):
    gencode = hl.experimental.import_gtf(
        gtf_path, reference_genome=reference_genome, min_partitions=100, skip_invalid_contigs=True
    )

    # Extract genes, transcripts, and exons from the GTF file
    genes = get_genes(gencode)
    transcripts = get_transcripts(gencode)
    exons = get_exons(gencode)
    exons = exons.cache()

    # Annotate transcripts with their exons
    transcript_exons = exons.group_by(exons.transcript_id).aggregate(exons=hl.agg.collect(exons.row_value))
    transcripts = transcripts.annotate(
        exons=transcript_exons[transcripts.transcript_id].exons.map(
            lambda exon: exon.select("feature_type", "start", "stop")
        )
    )

    # Annotate genes with their transcripts
    gene_transcripts = transcripts.key_by()
    gene_transcripts = gene_transcripts.group_by(gene_transcripts.gene_id).aggregate(
        transcripts=hl.agg.collect(gene_transcripts.row_value.drop("gene_id", "chrom"))
    )
    genes = genes.annotate(**gene_transcripts[genes.gene_id])
    genes = genes.cache()

    return genes


def load_canonical_transcripts(canonical_transcripts_path):
    # Canonical transcripts file is a TSV with two columns: gene ID and transcript ID and no header row
    canonical_transcripts = hl.import_table(canonical_transcripts_path, force=True, no_header=True, min_partitions=100)
    canonical_transcripts = canonical_transcripts.rename({"f0": "gene_id", "f1": "transcript_id"})
    canonical_transcripts = canonical_transcripts.key_by("gene_id")
    return canonical_transcripts


def load_hgnc(hgnc_path):
    hgnc = hl.import_table(hgnc_path, min_partitions=100, missing="")
    hgnc = hgnc.select(
        hgnc_id=hgnc["HGNC ID"],
        symbol=hgnc["Approved symbol"],
        name=hgnc["Approved name"],
        previous_symbols=hgnc["Previous symbols"].split(",").map(lambda s: s.strip()),
        alias_symbols=hgnc["Alias symbols"].split(",").map(lambda s: s.strip()),
        omim_id=hgnc["OMIM ID(supplied by OMIM)"],
        gene_id=hl.or_else(hgnc["Ensembl gene ID"], hgnc["Ensembl ID(supplied by Ensembl)"]),
    )
    hgnc = hgnc.filter(hl.is_defined(hgnc.gene_id)).key_by("gene_id")
    return hgnc


def prepare_gene_models_helper(reference_genome):
    gencode_path = pipeline_config.get("reference_data", f"{reference_genome.lower()}_gencode_path")
    canonical_transcripts_path = pipeline_config.get(
        "reference_data", f"{reference_genome.lower()}_canonical_transcripts_path"
    )

    # Load genes from GTF file
    genes = load_gencode_gene_models(gencode_path, reference_genome)
    genes = genes.distinct()
    genes = genes.transmute(gencode_gene_symbol=genes.gene_symbol)

    # Annotate genes with canonical transcript
    canonical_transcripts = load_canonical_transcripts(canonical_transcripts_path)
    genes = genes.annotate(canonical_transcript_id=canonical_transcripts[genes.gene_id].transcript_id)

    # Drop transcripts except for canonical
    genes = genes.annotate(
        canonical_transcript=genes.transcripts.filter(
            lambda transcript: transcript.transcript_id == genes.canonical_transcript_id
        ).head()
    )
    genes = genes.annotate(
        canonical_transcript=genes.canonical_transcript.annotate(
            exons=hl.cond(
                genes.canonical_transcript.exons.any(lambda exon: exon.feature_type == "CDS"),
                genes.canonical_transcript.exons.filter(lambda exon: exon.feature_type == "CDS"),
                genes.canonical_transcript.exons.filter(lambda exon: exon.feature_type == "exon"),
            )
        )
    )
    genes = genes.drop("transcripts")

    return genes


def prepare_exac_constraint(exac_constraint_path):
    ds = hl.import_table(exac_constraint_path, force=True)

    ds = ds.select(
        transcript_id=ds.transcript.split("\\.")[0],
        # Expected
        exp_syn=hl.float(ds.exp_syn),
        exp_mis=hl.float(ds.exp_mis),
        exp_lof=hl.float(ds.exp_lof),
        # Actual
        obs_syn=hl.int(ds.n_syn),
        obs_mis=hl.int(ds.n_mis),
        obs_lof=hl.int(ds.n_lof),
        # mu
        mu_syn=hl.float(ds.mu_syn),
        mu_mis=hl.float(ds.mu_mis),
        mu_lof=hl.float(ds.mu_lof),
        # Z
        syn_z=hl.float(ds.syn_z),
        mis_z=hl.float(ds.mis_z),
        lof_z=hl.float(ds.lof_z),
        # Other
        pLI=hl.float(ds.pLI),
    )

    ds = ds.key_by("transcript_id")

    return ds


def prepare_gnomad_constraint(gnomad_constraint_path):
    ds = hl.read_table(gnomad_constraint_path)

    ds = ds.select_globals()

    # Select relevant fields
    ds = ds.select(
        transcript_id=ds.transcript,
        # Expected
        exp_lof=ds.exp_lof,
        exp_mis=ds.exp_mis,
        exp_syn=ds.exp_syn,
        # Observed
        obs_lof=ds.obs_lof,
        obs_mis=ds.obs_mis,
        obs_syn=ds.obs_syn,
        # Observed/Expected
        oe_lof=ds.oe_lof,
        oe_mis=ds.oe_mis,
        oe_syn=ds.oe_syn,
        # Z
        lof_z=ds.lof_z,
        mis_z=ds.mis_z,
        syn_z=ds.syn_z,
        # Other
        pLI=ds.pLI,
    )

    ds = ds.key_by("transcript_id").drop("gene", "transcript")

    return ds


def get_output_path(output_local):
    output_location = "local" if output_local else "gcs"
    output_date = pipeline_config.get("reference_data", "output_last_updated")
    output_root = pipeline_config.get("output", f"{output_location}_output_root")

    if output_local:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_root = os.path.abspath(os.path.join(script_dir, "..", "..", "..", output_root))

    return os.path.join(output_root, "gene_models", output_date, "gene_models.ht")


def prepare_gene_models(output_local):
    genes_grch37 = prepare_gene_models_helper("GRCh37")
    genes_grch38 = prepare_gene_models_helper("GRCh38")

    genes_grch37 = genes_grch37.select(GRCh37=genes_grch37.row_value)
    genes_grch38 = genes_grch38.select(GRCh38=genes_grch38.row_value)

    genes = genes_grch37.join(genes_grch38, how="outer")

    # Annotate genes with information from HGNC
    hgnc_path = pipeline_config.get("reference_data", "hgnc_path")
    hgnc = load_hgnc(hgnc_path)
    genes = genes.annotate(**hgnc[genes.gene_id])
    genes = genes.annotate(
        symbol=hl.or_else(genes.symbol, hl.or_else(genes.GRCh38.gencode_gene_symbol, genes.GRCh37.gencode_gene_symbol)),
    )

    # Collect all fields that can be used to search by gene symbol
    genes = genes.annotate(
        search_terms=hl.set(
            hl.empty_array(hl.tstr)
            .append(genes.symbol)
            .extend(hl.or_else(genes.previous_symbols, hl.empty_array(hl.tstr)))
            .extend(hl.or_else(genes.alias_symbols, hl.empty_array(hl.tstr)))
            .append(genes.GRCh38.gencode_gene_symbol)
            .append(genes.GRCh37.gencode_gene_symbol)
            .filter(hl.is_defined)
            .map(lambda s: s.upper())
        ),
    )

    gnomad_constraint_path = pipeline_config.get("reference_data", "gnomad_constraint_path")
    gnomad_constraint = prepare_gnomad_constraint(gnomad_constraint_path)
    genes = genes.annotate(gnomad_constraint=gnomad_constraint[genes.GRCh37.canonical_transcript_id])

    exac_constraint_path = pipeline_config.get("reference_data", "exac_constraint_path")
    exac_constraint = prepare_exac_constraint(exac_constraint_path)
    genes = genes.annotate(exac_constraint=exac_constraint[genes.GRCh37.canonical_transcript_id])

    output_path = get_output_path(output_local)
    genes.write(output_path, overwrite=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-local", action="store_true", help="Output files locally instead of to cloud storage")
    args = parser.parse_args()

    hl.init()
    prepare_gene_models(args.output_local)


if __name__ == "__main__":
    sys.exit(main())
