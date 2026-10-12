from configparser import ConfigParser

import hail as hl
import pytest

from data_pipeline.pipelines import prepare_gene_models


@pytest.fixture(scope="module", autouse=True)
def hail_backend(tmp_path_factory):
    temporary_directory = tmp_path_factory.mktemp("hail_gene_models")
    hl.init(master="local[2]", log=str(temporary_directory / "hail.log"), tmp_dir=str(temporary_directory))
    yield
    hl.stop()


@pytest.mark.parametrize("reference_genome,include_mane_tags", [("GRCh38", True), ("GRCh37", False)])
def test_prepare_gene_models_preserves_mane_select_without_changing_canonical(
    tmp_path, monkeypatch, reference_genome, include_mane_tags
):
    gtf_rows = []
    canonical_rows = []
    gene_transcripts = {
        "ENSG00000000001": ["ENST00000000001", "ENST00000000002"],
        "ENSG00000000002": ["ENST00000000003"],
        "ENSG00000000003": ["ENST00000000004"],
    }
    mane_select_transcripts = {"ENST00000000002", "ENST00000000003"}

    for gene_index, (gene_id, transcript_ids) in enumerate(gene_transcripts.items()):
        start = 100 + gene_index * 100
        stop = start + 50
        gene_attributes = f'gene_id "{gene_id}.7"; gene_name "GENE{gene_index}";'
        gtf_rows.append(f"chr1\tHAVANA\tgene\t{start}\t{stop}\t.\t+\t.\t{gene_attributes}")
        canonical_rows.append(f"{gene_id}\t{transcript_ids[0]}")

        for transcript_id in transcript_ids:
            attributes = f'{gene_attributes} transcript_id "{transcript_id}.2";'
            tags = ' tag "basic";'
            if include_mane_tags and transcript_id in mane_select_transcripts:
                tags += ' tag "MANE_Select";'
            else:
                tags += ' tag "MANE_Plus_Clinical";'
            tags += ' tag "appris_principal_1";'
            gtf_rows.append(f"chr1\tHAVANA\ttranscript\t{start}\t{stop}\t.\t+\t.\t{attributes}{tags}")
            gtf_rows.append(f"chr1\tHAVANA\texon\t{start}\t{stop}\t.\t+\t.\t{attributes}{tags}")
            gtf_rows.append(f"chr1\tHAVANA\tCDS\t{start + 5}\t{stop - 5}\t.\t+\t0\t{attributes}")

    gtf_path = tmp_path / "genes.gtf"
    gtf_path.write_text("# GTF fixture\n" + "\n".join(gtf_rows) + "\n", encoding="utf-8")
    canonical_path = tmp_path / "canonical.tsv"
    canonical_path.write_text("\n".join(canonical_rows) + "\n", encoding="utf-8")
    config = ConfigParser()
    config["reference_data"] = {
        f"{reference_genome.lower()}_gencode_path": str(gtf_path),
        f"{reference_genome.lower()}_canonical_transcripts_path": str(canonical_path),
    }
    monkeypatch.setattr(prepare_gene_models, "pipeline_config", config)

    genes = prepare_gene_models.prepare_gene_models_helper(reference_genome)
    gene_rows = {gene.gene_id: gene for gene in genes.collect()}

    assert "transcripts" not in genes.row.dtype.fields
    assert genes.mane_select_transcript_id.dtype == hl.tstr
    for gene_index, (gene_id, transcript_ids) in enumerate(gene_transcripts.items()):
        gene = gene_rows[gene_id]
        assert gene.canonical_transcript_id == transcript_ids[0]
        assert gene.canonical_transcript.transcript_id == transcript_ids[0]
        assert len(gene.canonical_transcript.exons) == 1
        assert gene.canonical_transcript.exons[0].feature_type == "CDS"
        assert gene.canonical_transcript.exons[0].start == 105 + gene_index * 100
        assert gene.canonical_transcript.exons[0].stop == 145 + gene_index * 100
        expected_mane_transcript = next(
            (transcript_id for transcript_id in transcript_ids if transcript_id in mane_select_transcripts), None
        )
        assert gene.mane_select_transcript_id == (expected_mane_transcript if include_mane_tags else None)
