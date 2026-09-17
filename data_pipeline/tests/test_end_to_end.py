"""End-to-end snapshot tests for ``combine_datasets`` + ``write_results_files``.

Synthetic ``.ht`` intermediates (see ``fixtures/synthetic_inputs.py``) are run
through the two offline pipeline steps, and the resulting JSON tree is compared
against committed golden copies in ``__snapshots__/``.

The goldens are canonical JSON rather than hashes, so a regression shows up as a
readable diff in review. ``__snapshots__/MANIFEST.txt`` pins the *set* of files
produced, which is what catches a file that silently stops being written --- the
absent ``ENSG00000000202_GRCh38.json`` and ``ENSG00000000404_testb_variants.json``
are assertions in their own right.

Regenerate with ``pytest --snapshot-update``; never regenerate silently. Because
the per-file test cases are parametrized from the committed snapshots at
collection time, regenerating from scratch takes two runs: one to write them and
one to verify them.

Alongside the snapshots there are targeted assertions for the behaviours the
fixtures were designed to pin down. They overlap with the snapshots on purpose:
a snapshot diff says *something* changed, these say *what* broke.
"""

import json
import re
import shutil
from pathlib import Path

import pytest
from write_results_files import write_data_files

from data_pipeline.pipelines.combine_datasets import combine_datasets

from .canonicalize import MANIFEST_FILENAME, canonicalize_directory, manifest_text, relative_output_paths
from .fixtures.synthetic_inputs import (
    BOTH_GENE,
    DATASET_IDS,
    GENE_IDS,
    GRCH37_ONLY_GENE,
    GRCH38_ONLY_GENE,
    OUTPUT_DATE,
    PAR_GENE,
    SPARSE_GENE,
    build_synthetic_inputs,
)

SNAPSHOT_DIR = Path(__file__).parent / "__snapshots__"


# --------------------------------------------------------------------------- #
# Running the pipeline
# --------------------------------------------------------------------------- #


def _run_pipeline(root):
    """Build synthetic inputs under ``root`` and run steps 3 and 4 over them.

    Returns the directory of JSON files that ``write_results_files`` produced.
    """
    root = Path(root)
    build_synthetic_inputs(root)

    combined_path = str(root / "combined" / OUTPUT_DATE / "combined.ht")
    combine_datasets(DATASET_IDS, str(root)).write(combined_path, overwrite=True)

    results_directory = root / "results_files"
    # The explicit gene list bypasses repartition(500) and the cross-dataset
    # VARIANT_THRESHOLD filter, neither of which is meaningful at this scale.
    write_data_files(combined_path, str(results_directory), genes=GENE_IDS)

    return results_directory


@pytest.fixture(scope="session")
def pipeline_output(tmp_path_factory, test_pipeline_config, hail_context, request):
    output = _run_pipeline(tmp_path_factory.mktemp("pipeline"))

    if request.config.getoption("--snapshot-update"):
        _rewrite_snapshots(output)

    return output


def _rewrite_snapshots(output):
    if SNAPSHOT_DIR.exists():
        shutil.rmtree(SNAPSHOT_DIR)

    canonical = canonicalize_directory(output)
    for relative_path, text in canonical.items():
        destination = SNAPSHOT_DIR / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text, encoding="utf-8")

    (SNAPSHOT_DIR / MANIFEST_FILENAME).write_text(manifest_text(canonical), encoding="utf-8")


def _snapshot_relative_paths():
    """Snapshotted output paths, read at collection time so each file is a test case."""
    if not SNAPSHOT_DIR.exists():
        return []
    return [path for path in relative_output_paths(SNAPSHOT_DIR) if path != MANIFEST_FILENAME]


@pytest.fixture(scope="session")
def canonical_output(pipeline_output):
    return canonicalize_directory(pipeline_output)


def _read_json(pipeline_output, relative_path):
    return json.loads((Path(pipeline_output) / relative_path).read_text(encoding="utf-8"))


# --------------------------------------------------------------------------- #
# Snapshots
# --------------------------------------------------------------------------- #


def test_snapshots_exist(pipeline_output):
    assert _snapshot_relative_paths(), (
        f"no snapshots committed under {SNAPSHOT_DIR}; generate them with `pytest --snapshot-update`"
    )


def test_manifest_matches_snapshot(pipeline_output):
    expected = (SNAPSHOT_DIR / MANIFEST_FILENAME).read_text(encoding="utf-8")
    actual = manifest_text(relative_output_paths(pipeline_output))

    assert actual == expected, (
        "the set of files written by the pipeline changed; "
        "review the diff and rerun with --snapshot-update if it is intended"
    )


@pytest.mark.parametrize("relative_path", _snapshot_relative_paths())
def test_output_file_matches_snapshot(canonical_output, relative_path):
    expected = (SNAPSHOT_DIR / relative_path).read_text(encoding="utf-8")

    assert relative_path in canonical_output, f"{relative_path} was not written by the pipeline"
    assert canonical_output[relative_path] == expected


def test_output_is_reproducible(pipeline_output, tmp_path_factory):
    """A second run over the same inputs must canonicalize identically.

    Snapshots are only meaningful if the pipeline is deterministic. The known
    sources of variation are Python's randomized string hashing over
    ``collect_as_set`` results and Hail's partitioning; this asserts neither
    leaks into the output.
    """
    second_run = _run_pipeline(tmp_path_factory.mktemp("pipeline-rerun"))

    assert canonicalize_directory(second_run) == canonicalize_directory(pipeline_output)


# --------------------------------------------------------------------------- #
# Gene documents and the GRCh37/GRCh38 outer join
# --------------------------------------------------------------------------- #


def test_gene_on_both_assemblies_has_a_document_per_assembly(pipeline_output):
    for reference_genome in ("GRCh37", "GRCh38"):
        document = _read_json(pipeline_output, f"genes/101/{BOTH_GENE}_{reference_genome}.json")
        assert document["gene"]["reference_genome"] == reference_genome


def test_grch37_only_gene_has_no_grch38_document(pipeline_output):
    assert (Path(pipeline_output) / f"genes/202/{GRCH37_ONLY_GENE}_GRCh37.json").exists()
    assert not (Path(pipeline_output) / f"genes/202/{GRCH37_ONLY_GENE}_GRCh38.json").exists()


def test_grch38_only_gene_has_no_grch37_document(pipeline_output):
    assert (Path(pipeline_output) / f"genes/303/{GRCH38_ONLY_GENE}_GRCh38.json").exists()
    assert not (Path(pipeline_output) / f"genes/303/{GRCH38_ONLY_GENE}_GRCh37.json").exists()


def test_null_constraint_structs_pass_through_as_null(pipeline_output):
    gene = _read_json(pipeline_output, f"genes/404/{SPARSE_GENE}_GRCh37.json")["gene"]

    assert gene["exac_constraint"] is None
    assert gene["gnomad_v2_constraint"] is None
    assert gene["gnomad_v4_constraint"] is None


def test_search_terms_include_symbol_previous_and_alias_symbols(pipeline_output):
    gene = _read_json(pipeline_output, f"genes/101/{BOTH_GENE}_GRCh38.json")["gene"]

    assert sorted(gene["search_terms"]) == ["ALIASBOTH", "BOTH2", "BOTHGENE", "OLDBOTH"]


@pytest.mark.parametrize("gene_id", GENE_IDS)
def test_gene_shard_matches_the_server_implementation(pipeline_output, gene_id):
    """``write_results_files`` and ``server.ts`` compute the shard independently.

    Python uses ``int(gene_id.lstrip("ENSGR")) % 1000``, which strips *characters*;
    ``src/server/server.ts:geneDataDirectory`` uses
    ``Number(geneId.replace(/^ENSGR?/, '')) % 1000``. ``ENSGR``-prefixed IDs are
    where the two could plausibly disagree.
    """
    server_shard = str(int(re.sub(r"^ENSGR?", "", gene_id)) % 1000).zfill(3)

    written = [path for path in relative_output_paths(pipeline_output) if f"/{gene_id}_" in f"/{path}"]

    assert written, f"no files written for {gene_id}"
    assert {Path(path).parent.name for path in written} == {server_shard}


# --------------------------------------------------------------------------- #
# Per-dataset variant files
# --------------------------------------------------------------------------- #


def _variants(pipeline_output, shard, gene_id, dataset_id):
    return _read_json(pipeline_output, f"genes/{shard}/{gene_id}_{dataset_id.lower()}_variants.json")["variants"]


def _variant_ids(variants):
    # Index 0 of the positional variant tuple, per combine_datasets.VARIANT_FIELDS.
    return sorted(variant[0] for variant in variants)


def test_dataset_with_no_variants_for_a_gene_writes_an_empty_file(pipeline_output):
    """A gene with no variants in a dataset still gets a file, containing ``[]``.

    ``write_json_files`` guards the write with ``if dataset_variants:``, but by
    that point ``dataset_variants`` is already a JSON *string*, so
    ``'{"variants": []}'`` is truthy and the guard never fires. This matches the
    published data today, so it is pinned rather than assumed away; dropping
    these files is a real (small) output change, not a no-op.
    """
    assert _variants(pipeline_output, "404", SPARSE_GENE, "TestA")
    assert _variants(pipeline_output, "404", SPARSE_GENE, "TestB") == []


def test_grch38_variant_ids_strip_the_chr_prefix(pipeline_output):
    variant_ids = _variant_ids(_variants(pipeline_output, "101", BOTH_GENE, "TestA"))

    assert variant_ids == ["1-200300-A-ATTT", "1-200400-CTTG-C", "1-200500-A-G"]


def test_grch37_variant_ids_are_unprefixed(pipeline_output):
    variant_ids = _variant_ids(_variants(pipeline_output, "101", BOTH_GENE, "TestB"))

    assert variant_ids == ["1-100100-AT-A", "1-100200-G-C"]


def test_same_variant_in_two_datasets_stays_in_separate_files(pipeline_output):
    shared_variant_id = "1-200500-A-G"

    assert shared_variant_id in _variant_ids(_variants(pipeline_output, "101", BOTH_GENE, "TestA"))
    assert shared_variant_id in _variant_ids(_variants(pipeline_output, "101", BOTH_GENE, "TestClinVar"))


def test_missing_analysis_group_becomes_a_null_tuple_not_a_gap(pipeline_output):
    metadata = _read_json(pipeline_output, "metadata.json")
    groups = metadata["datasets"]["TestA"]["variant_result_analysis_groups"]
    variant_fields = metadata["variant_fields"]
    group_results_index = variant_fields.index("group_results")

    variants = _variants(pipeline_output, "101", BOTH_GENE, "TestA")
    by_id = {variant[0]: variant for variant in variants}
    group_results = by_id["1-200300-A-ATTT"][group_results_index]

    assert len(group_results) == len(groups)
    assert group_results[groups.index("case_control")] is not None
    assert group_results[groups.index("meta")] is None


def test_non_finite_floats_are_encoded_as_strings(pipeline_output):
    metadata = _read_json(pipeline_output, "metadata.json")
    info_index = metadata["variant_fields"].index("info")
    info_fields = metadata["datasets"]["TestA"]["variant_info_field_names"]

    variants = _variants(pipeline_output, "202", GRCH37_ONLY_GENE, "TestA")
    info = variants[0][info_index]

    assert info[info_fields.index("cadd")] == "NaN"
    assert info[info_fields.index("revel")] == "Infinity"


def test_floats_are_written_with_five_significant_digits(pipeline_output):
    """The ``"{:.5g}"`` formatting is observable by the frontend, so pin the text.

    Asserted against the raw file text: re-parsing the number would hide the
    formatting, which is the whole point.
    """
    text = (Path(pipeline_output) / f"genes/303/{GRCH38_ONLY_GENE}_testa_variants.json").read_text(encoding="utf-8")

    # info.cadd was 987654321.123456 and info.revel was 0.123456789.
    assert "9.8765e+08" in text
    assert "0.12346" in text
    assert "987654321" not in text


# --------------------------------------------------------------------------- #
# metadata.json and results/<dataset>.json
# --------------------------------------------------------------------------- #


def test_metadata_lists_every_dataset(pipeline_output):
    metadata = _read_json(pipeline_output, "metadata.json")

    assert list(metadata["datasets"]) == DATASET_IDS


def test_metadata_records_each_dataset_reference_genome(pipeline_output):
    """Datasets differ in reference genome; nothing may assume uniformity."""
    metadata = _read_json(pipeline_output, "metadata.json")

    assert metadata["datasets"]["TestA"]["reference_genome"] == "GRCh38"
    assert metadata["datasets"]["TestB"]["reference_genome"] == "GRCh37"
    assert metadata["datasets"]["TestClinVar"]["reference_genome"] == "GRCh38"


def test_analysis_groups_are_ordered_deterministically(pipeline_output):
    """The frontend indexes into these arrays, so their order is the contract."""
    metadata = _read_json(pipeline_output, "metadata.json")
    testa = metadata["datasets"]["TestA"]

    assert testa["gene_result_analysis_groups"] == ["case_control", "meta"]
    assert testa["variant_result_analysis_groups"] == ["case_control", "meta"]


def test_results_file_omits_genes_with_no_result_for_that_dataset(pipeline_output):
    testa_gene_ids = [row[0] for row in _read_json(pipeline_output, "results/testa.json")["results"]]
    testb_gene_ids = [row[0] for row in _read_json(pipeline_output, "results/testb.json")["results"]]

    assert sorted(testa_gene_ids) == sorted(GENE_IDS)
    assert SPARSE_GENE not in testb_gene_ids


def test_clinvar_style_dataset_has_dummy_gene_results(pipeline_output):
    metadata = _read_json(pipeline_output, "metadata.json")
    results = _read_json(pipeline_output, "results/testclinvar.json")["results"]

    assert metadata["datasets"]["TestClinVar"]["gene_result_analysis_groups"] == ["dummy"]
    assert [row[0] for row in results] == [BOTH_GENE]


def test_results_file_uses_the_dataset_reference_genome(pipeline_output):
    results = _read_json(pipeline_output, "results/testa.json")["results"]
    row = next(row for row in results if row[0] == BOTH_GENE)
    chrom, midpoint = row[3], row[4]

    # TestA is GRCh38, where BOTHGENE spans 200,000-203,000.
    assert (chrom, midpoint) == ("1", 201_500)


def test_gene_search_terms_cover_every_gene(pipeline_output):
    lines = (Path(pipeline_output) / "gene_search_terms.json.txt").read_text(encoding="utf-8").splitlines()
    entries = [json.loads(line) for line in lines if line.strip()]

    assert sorted(entry[0] for entry in entries) == sorted(GENE_IDS)
    assert sorted(next(entry[1] for entry in entries if entry[0] == PAR_GENE)) == ["PARGENE"]
