import csv
from configparser import ConfigParser

import hail as hl
import pytest

from data_pipeline.datasets.asc2 import asc2_variant_results


@pytest.fixture(scope="module", autouse=True)
def hail_backend(tmp_path_factory):
    temporary_directory = tmp_path_factory.mktemp("hail_asc2_variant_results")
    hl.init(master="local[2]", log=str(temporary_directory / "hail.log"), tmp_dir=str(temporary_directory))
    yield
    hl.stop()


@pytest.mark.parametrize("include_hgvsc_column", [True, False])
def test_prepare_variant_results_imports_hgvsc_and_accepts_legacy_handoffs(tmp_path, monkeypatch, include_hgvsc_column):
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

    variants = asc2_variant_results.prepare_variant_results(False, str(tmp_path))
    rows = {row.locus.position: row for row in variants.collect()}

    assert variants.hgvsc.dtype == hl.tstr
    assert len(rows) == 3
    for source_variant in source_variants:
        position = int(source_variant["Variant"].split(":")[1])
        row = rows[position]
        expected_hgvsc = (source_variant["HGVSc"] or None) if include_hgvsc_column else None
        assert row.hgvsc == expected_hgvsc
        assert row.hgvsp == (source_variant["HGVSp"] or None)
        assert row.info.transcript_id == "ENST00000000001"
        assert row.info.variant_class == source_variant["Class"]
        assert row.group_results["meta"].de_novo_ac_proband == 1
        assert row.group_results["meta"].transmitted_ac_proband == 2
