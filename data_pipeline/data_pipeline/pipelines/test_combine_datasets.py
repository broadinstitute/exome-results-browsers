import configparser

import hail as hl
import pytest

from data_pipeline.pipelines import combine_datasets


@pytest.fixture(scope="module", autouse=True)
def hail_context(tmp_path_factory):
    hl.init(
        quiet=True, master="local[2]", idempotent=True, log=str(tmp_path_factory.mktemp("hail_combine") / "hail.log")
    )
    yield
    hl.stop()


@pytest.fixture
def config(monkeypatch):
    config = configparser.ConfigParser()
    config["example"] = {"output_last_updated": "release"}
    config["reference_data"] = {"output_last_updated": "release"}
    monkeypatch.setattr(combine_datasets, "pipeline_config", config)
    return config


def test_coalescing_reduces_partitions_without_changing_data(config, capsys):
    config.set("example", "combine_variant_max_partitions", "2")
    table = hl.utils.range_table(6, n_partitions=6).annotate_globals(release="test")
    result = combine_datasets.coalesce_combine_input(table, "example", "variant")
    assert result.n_partitions() == 2
    assert result.collect() == table.collect()
    assert result.key.dtype == table.key.dtype
    assert hl.eval(result.globals) == hl.eval(table.globals)
    assert "coalescing 6 -> 2 partitions" in capsys.readouterr().out


@pytest.mark.parametrize("maximum", [None, "20"])
def test_unconfigured_or_already_small_inputs_are_unchanged(config, maximum):
    if maximum is not None:
        config.set("example", "combine_gene_max_partitions", maximum)
    table = hl.utils.range_table(6, n_partitions=2)
    assert combine_datasets.coalesce_combine_input(table, "example", "gene") is table


@pytest.mark.parametrize("maximum", ["0", "-1"])
def test_rejects_nonpositive_partition_caps(config, maximum):
    config.set("example", "combine_gene_max_partitions", maximum)
    with pytest.raises(ValueError, match="example.combine_gene_max_partitions must be a positive integer"):
        combine_datasets.coalesce_combine_input(hl.utils.range_table(1), "example", "gene")


def test_combine_preserves_results_with_gene_and_variant_partition_caps(tmp_path, config, capsys):
    genes = hl.utils.range_table(6, n_partitions=6)
    genes = genes.key_by(gene_id=hl.str(genes.idx)).select(group_results=hl.dict({"all": hl.struct(p=0.1)}))
    genes.select().write(str(tmp_path / "gene_models/release/gene_models.ht"))
    genes.write(str(tmp_path / "example/release/gene_results.ht"))

    variants = hl.utils.range_table(6, n_partitions=6)
    variants = variants.annotate(
        gene_id=hl.str(variants.idx),
        locus=hl.locus("chr1", variants.idx + 1, reference_genome="GRCh38"),
        alleles=["A", "T"],
        consequence="missense_variant",
        hgvsc="c.1A>T",
        hgvsp="p.Lys1Asn",
        info=hl.struct(score=1.0),
        group_results=hl.dict({"all": hl.struct(p=0.2)}),
    )
    variants.key_by("locus", "alleles").drop("idx").write(str(tmp_path / "example/release/variant_results.ht"))

    baseline = combine_datasets.combine_datasets(["example"], str(tmp_path))
    expected_rows = baseline.collect()
    expected_globals = hl.eval(baseline.globals)
    config.set("example", "combine_gene_max_partitions", "2")
    config.set("example", "combine_variant_max_partitions", "3")
    result = combine_datasets.combine_datasets(["example"], str(tmp_path))
    assert result.collect() == expected_rows
    assert hl.eval(result.globals) == expected_globals
    output = capsys.readouterr().out
    assert "example gene results: coalescing 6 -> 2 partitions" in output
    assert "example variant results: coalescing 6 -> 3 partitions" in output
