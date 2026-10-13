import json
import stat
from unittest.mock import MagicMock

import pytest
import write_results_files
from write_results_files import ResultEncoder, assemble_variant_chunks


def write_chunk(path, variants):
    path.write_text(json.dumps(variants), encoding="utf-8")
    return str(path)


def test_assemble_variant_chunks_preserves_existing_json_format(tmp_path):
    variants = [
        ["1-100-A-T", 100, {"score": 1.234567, "value": float("nan")}],
        ["1-200-G-C", 200, {"score": float("inf")}],
        ["1-300-T-G", 300, {"score": float("-inf")}],
    ]
    first_chunk = write_chunk(tmp_path / "first.json", variants[:2])
    second_chunk = write_chunk(tmp_path / "second.json", variants[2:])
    output_path = tmp_path / "variants.json"

    written_variant_count, byte_size = assemble_variant_chunks(
        str(output_path),
        [(1, second_chunk), (0, first_chunk)],
        expected_chunk_count=2,
        expected_variant_count=3,
    )

    expected = json.dumps({"variants": variants}, cls=ResultEncoder)
    assert output_path.read_text(encoding="utf-8") == expected
    assert stat.S_IMODE(output_path.stat().st_mode) == 0o644
    assert written_variant_count == 3
    assert byte_size == len(expected.encode())


def test_assemble_variant_chunks_writes_empty_variant_array(tmp_path):
    output_path = tmp_path / "variants.json"

    written_variant_count, byte_size = assemble_variant_chunks(
        str(output_path),
        [],
        expected_chunk_count=0,
        expected_variant_count=0,
    )

    assert output_path.read_text(encoding="utf-8") == '{"variants":[]}'
    assert written_variant_count == 0
    assert byte_size == len(b'{"variants":[]}')


def test_assemble_variant_chunks_rejects_missing_chunk(tmp_path):
    output_path = tmp_path / "variants.json"
    output_path.write_text("stale", encoding="utf-8")
    first_chunk = write_chunk(tmp_path / "first.json", [["first"]])

    with pytest.raises(ValueError, match="Invalid chunks"):
        assemble_variant_chunks(
            str(output_path),
            [(0, first_chunk)],
            expected_chunk_count=2,
            expected_variant_count=2,
        )

    assert not output_path.exists()


def test_assemble_variant_chunks_rejects_duplicate_chunk(tmp_path):
    output_path = tmp_path / "variants.json"
    first_chunk = write_chunk(tmp_path / "first.json", [["first"]])
    duplicate_chunk = write_chunk(tmp_path / "duplicate.json", [["duplicate"]])

    with pytest.raises(ValueError, match="Duplicate chunks"):
        assemble_variant_chunks(
            str(output_path),
            [(0, first_chunk), (0, duplicate_chunk)],
            expected_chunk_count=1,
            expected_variant_count=1,
        )

    assert not output_path.exists()


def test_assemble_variant_chunks_rejects_wrong_variant_count_atomically(tmp_path):
    output_path = tmp_path / "variants.json"
    only_chunk = write_chunk(tmp_path / "only.json", [["first"]])

    with pytest.raises(ValueError, match="Invalid variant count"):
        assemble_variant_chunks(
            str(output_path),
            [(0, only_chunk)],
            expected_chunk_count=1,
            expected_variant_count=2,
        )

    assert not output_path.exists()
    assert not list(tmp_path.glob(".variants.json.*.tmp"))


@pytest.mark.parametrize("directory_exists", [False, True])
def test_write_data_files_writes_empty_oversized_report_without_prior_exports(tmp_path, monkeypatch, directory_exists):
    output_directory = tmp_path / "nested" / "results"
    if directory_exists:
        output_directory.mkdir(parents=True)
        (output_directory / "existing.txt").write_text("keep", encoding="utf-8")

    table = MagicMock()
    for method in ["annotate", "filter", "select", "drop", "repartition"]:
        getattr(table, method).return_value = table
    table.collect.return_value = []
    table.count.return_value = 1
    table.total_variants = 1
    table.variants.dtype.fields = ["AGB"]
    hail = MagicMock()
    hail.read_table.return_value = table
    write_gene_summary_file = MagicMock()
    write_json_files = MagicMock()
    monkeypatch.setattr(write_results_files, "hl", hail)
    monkeypatch.setattr(write_results_files, "write_gene_summary_file", write_gene_summary_file)
    monkeypatch.setattr(write_results_files, "write_json_files", write_json_files)

    write_results_files.write_data_files("combined.ht", str(output_directory))

    report_path = output_directory / "oversized_genes_report.json"
    assert json.loads(report_path.read_text(encoding="utf-8")) == {"genes": []}
    write_gene_summary_file.assert_called_once_with(str(output_directory), table)
    write_json_files.assert_called_once_with(str(output_directory), "temp_parts", 1)
    if directory_exists:
        assert (output_directory / "existing.txt").read_text(encoding="utf-8") == "keep"
