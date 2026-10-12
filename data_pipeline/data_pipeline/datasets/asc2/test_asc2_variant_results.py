import csv
from collections import Counter
from configparser import ConfigParser

import hail as hl
import pytest

from data_pipeline.datasets.asc2 import asc2_variant_results
from data_pipeline.validation import validate_variant_results_table


@pytest.fixture(scope="module", autouse=True)
def hail_backend(tmp_path_factory):
    temporary_directory = tmp_path_factory.mktemp("hail_asc2_variant_results")
    hl.init(master="local[2]", log=str(temporary_directory / "hail.log"), tmp_dir=str(temporary_directory))
    yield
    hl.stop()


@pytest.mark.parametrize("include_hgvsc_column", [True, False])
def test_prepare_variant_results_requires_hgvsc_column(tmp_path, monkeypatch, include_hgvsc_column):
    source_path = tmp_path / "variants.tsv"
    fields = [
        field for field in asc2_variant_results.VARIANT_RESULTS_FIELDS if include_hgvsc_column or field != "HGVSc"
    ]
    common_fields = {
        "Gene": "GENE1",
        "Gene ID": "ENSG00000000001",
        "Transcript ID": "ENST00000000001",
        "MPC": "",
        "AM": "",
        "isOS": "FALSE",
        "gnomAD AF": "0",
        "de novo AC proband": "1",
        "de novo AC sibling": "0",
        "transmitted AC proband": "2",
        "untransmitted AC proband": "3",
        "AC case": "4",
        "AC control": "5",
    }
    source_variants = [
        {
            "Variant": "1:100:A:T",
            "HGVSp": "p.Lys34Asn",
            "HGVSc": "c.100A>T",
            "Class": "Mis1",
            "Consequence": "missense",
        },
        {
            "Variant": "1:101:G:A",
            "HGVSp": "",
            "HGVSc": "c.101+1G>A",
            "Class": "PTV",
            "Consequence": "splice donor",
        },
        {
            "Variant": "1:102:C:T",
            "HGVSp": "p.Arg35=",
            "HGVSc": "",
            "Class": "synonymous",
            "Consequence": "synonymous",
        },
    ]
    with source_path.open("w", encoding="utf-8", newline="") as source_file:
        writer = csv.DictWriter(source_file, fieldnames=fields, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        writer.writerows({**common_fields, **variant} for variant in source_variants)

    config = ConfigParser()
    config["ASC2"] = {"variant_results_path": str(source_path)}
    monkeypatch.setattr(asc2_variant_results, "pipeline_config", config)

    if not include_hgvsc_column:
        with pytest.raises(LookupError, match="no field 'HGVSc'"):
            asc2_variant_results.prepare_variant_results(False, str(tmp_path))
        return

    variants = asc2_variant_results.prepare_variant_results(False, str(tmp_path))
    rows = {row.locus.position: row for row in variants.collect()}

    assert variants.hgvsc.dtype == hl.tstr
    assert len(rows) == 3
    for source_variant in source_variants:
        position = int(source_variant["Variant"].split(":")[1])
        row = rows[position]
        expected_hgvsc = source_variant["HGVSc"] or None
        assert row.hgvsc == expected_hgvsc
        assert row.hgvsp == (source_variant["HGVSp"] or None)
        assert row.info.transcript_id == "ENST00000000001"
        assert row.info.variant_class == source_variant["Class"]
        assert row.group_results["meta"].de_novo_ac_proband == 1
        assert row.group_results["meta"].transmitted_ac_proband == 2


@pytest.mark.parametrize("repeat_synonymous_row", [False, True])
def test_prepare_variant_results_preserves_duplicate_annotation_rows(tmp_path, monkeypatch, repeat_synonymous_row):
    source_path = tmp_path / "antxr1_variants.tsv"
    common_fields = {
        "Variant": "2:69193415:G:A",
        "Gene": "ANTXR1",
        "Gene ID": "ENSG00000169604",
        "Transcript ID": "ENST00000303714",
        "HGVSp": "p.Thr478=",
        "HGVSc": "",
        "Consequence": "splice region",
        "MPC": "",
        "AM": "",
        "isOS": "TRUE",
        "gnomAD AF": "4.3245e-05",
    }
    count_fields = [
        "de novo AC proband",
        "de novo AC sibling",
        "transmitted AC proband",
        "untransmitted AC proband",
        "AC case",
        "AC control",
    ]
    source_rows = [
        {**common_fields, "Class": "PTV", **dict(zip(count_fields, [1, 0, 0, 0, 0, 0]))},
        {**common_fields, "Class": "synonymous", **dict(zip(count_fields, [0, 0, 4, 4, 2, 1]))},
    ]
    if repeat_synonymous_row:
        source_rows.append(dict(source_rows[1]))

    with source_path.open("w", encoding="utf-8", newline="") as source_file:
        writer = csv.DictWriter(
            source_file, fieldnames=list(asc2_variant_results.VARIANT_RESULTS_FIELDS), delimiter="\t"
        )
        writer.writeheader()
        writer.writerows(source_rows)

    config = ConfigParser()
    config["ASC2"] = {"variant_results_path": str(source_path)}
    monkeypatch.setattr(asc2_variant_results, "pipeline_config", config)

    variants = asc2_variant_results.prepare_variant_results(False, str(tmp_path))
    validate_variant_results_table(variants)
    rows = variants.collect()

    assert len(rows) == len(source_rows)
    expected_counts = Counter(
        (source_row["Class"], *(source_row[field] for field in count_fields)) for source_row in source_rows
    )
    observed_counts = Counter(
        (
            row.info.variant_class,
            *(
                row.group_results["meta"][asc2_variant_results.VARIANT_RESULTS_FIELDS[field][0]]
                for field in count_fields
            ),
        )
        for row in rows
    )
    assert observed_counts == expected_counts
    for row in rows:
        assert row.gene_id == "ENSG00000169604"
        assert row.locus == hl.Locus("chr2", 69193415, reference_genome="GRCh38")
        assert row.alleles == ["G", "A"]
        assert row.consequence == "splice region"
        assert row.hgvsp == "p.Thr478="
        assert row.hgvsc is None
        assert row.info.transcript_id == "ENST00000303714"
        assert row.info.is_other_splice is True

    gene_variants = variants.group_by("gene_id").aggregate(variants=hl.agg.collect(variants.row_value))
    assert len(gene_variants.collect()[0].variants) == len(source_rows)
