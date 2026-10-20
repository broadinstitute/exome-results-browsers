import configparser
from dataclasses import replace
from types import SimpleNamespace

import hail as hl
import pytest

from data_pipeline.input_validation import InputTableContract, preflight_dataset_inputs, validate_input_tables


@pytest.fixture(scope="module", autouse=True)
def hail_context(tmp_path_factory):
    hl.init(master="local[2]", quiet=True, idempotent=True, log=str(tmp_path_factory.mktemp("hail") / "hail.log"))
    yield
    hl.stop()


@pytest.fixture
def input_table():
    return hl.Table.parallelize(
        [
            {"group": "cd", "category": "ptv", "score": 0.1, "nested": [{"x": 1, "y": "a"}]},
            {"group": "uc", "category": "ptv", "score": 0.2, "nested": [{"x": 2, "y": "b"}]},
        ],
        schema=hl.tstruct(
            group=hl.tstr,
            category=hl.tstr,
            score=hl.tfloat64,
            nested=hl.tarray(hl.tstruct(x=hl.tint32, y=hl.tstr)),
        ),
    )


@pytest.fixture
def contract(input_table):
    return InputTableContract(
        row_schema=input_table.row.dtype,
        categorical_values={"group": frozenset({"cd", "uc"}), "category": frozenset({"ptv"})},
        row_count=2,
    )


def validate_table(tmp_path, table, contract):
    path = str(tmp_path / "input.ht")
    table.write(path)
    validate_input_tables("example", {"results": path}, {"results": contract})


def test_accepts_reordered_fields_including_nested_structs(tmp_path, input_table, contract, capsys):
    table = input_table.select(
        "score", "category", "group", nested=input_table.nested.map(lambda item: hl.struct(y=item.y, x=item.x))
    )
    validate_table(tmp_path, table, contract)
    assert "input preflight passed" in capsys.readouterr().out


@pytest.mark.parametrize(
    "change,expected",
    [
        (lambda t: t.rename({"score": "Score"}), ["Missing: row.score", "Added: row.Score"]),
        (lambda t: t.annotate(score=hl.str(t.score)), ["row.score: float64 -> str"]),
        (lambda t: t.annotate(extra=1), ["Added: row.extra"]),
        (lambda t: t.key_by("group"), ["Changed: key"]),
        (lambda t: t.annotate_globals(release="new"), ["Added: globals.release"]),
        (
            lambda t: t.annotate(nested=t.nested.map(lambda item: hl.struct(x=hl.str(item.x), y=item.y))),
            ["row.nested[].x: int32 -> str"],
        ),
    ],
)
def test_reports_schema_drift_without_scanning_rows(tmp_path, input_table, contract, monkeypatch, change, expected):
    path = str(tmp_path / "input.ht")
    change(input_table).write(path)

    def unexpected_scan(*args, **kwargs):
        pytest.fail("Schema failure must precede row scans")

    monkeypatch.setattr(hl.Table, "aggregate", unexpected_scan)
    with pytest.raises(ValueError) as error:
        validate_input_tables("example", {"first": path, "second": path}, {"first": contract, "second": contract})
    message = str(error.value)
    for fragment in ["example first", "example second", path, *expected]:
        assert fragment in message


def test_rejects_changed_reference_genome(tmp_path):
    table = hl.Table.parallelize(
        [{"locus": hl.Locus("1", 1, reference_genome="GRCh37")}],
        schema=hl.tstruct(locus=hl.tlocus("GRCh37")),
        key="locus",
    )
    contract = InputTableContract(row_schema=hl.tstruct(locus=hl.tlocus("GRCh38")), key=("locus",))
    with pytest.raises(ValueError, match="locus<GRCh38> -> locus<GRCh37>"):
        validate_table(tmp_path, table, contract)


@pytest.mark.parametrize("field,value", [("group", "renamed"), ("category", "new-category"), ("group", None)])
def test_rejects_renamed_categories_and_missing_values(tmp_path, input_table, contract, field, value):
    table = input_table.annotate(**{field: hl.literal(value, hl.tstr)})
    with pytest.raises(ValueError) as error:
        validate_table(tmp_path, table, contract)
    assert f"{field}: missing values=" in str(error.value)
    assert repr(value) in str(error.value)


def test_rejects_disappearing_category(tmp_path, input_table, contract):
    table = input_table.filter(input_table.group == "cd")
    with pytest.raises(ValueError, match="missing values=\\['uc'\\]"):
        validate_table(tmp_path, table, contract)


def test_row_count_change_warns_without_failing(tmp_path, input_table, contract, capsys):
    validate_table(tmp_path, input_table.union(input_table), contract)
    output = capsys.readouterr().out
    assert "WARNING:" in output
    assert "previous=2; current=4" in output
    assert "input preflight passed" in output
    assert contract.row_count == 2


def test_optional_row_count_and_categories_need_no_scan(tmp_path, input_table, contract, monkeypatch):
    path = str(tmp_path / "input.ht")
    input_table.write(path)
    monkeypatch.setattr(hl.Table, "aggregate", lambda *args, **kwargs: pytest.fail("Unexpected row scan"))
    validate_input_tables(
        "example", {"results": path}, {"results": replace(contract, row_count=None, categorical_values={})}
    )


def test_dataset_without_contract_is_unchanged():
    config = configparser.ConfigParser()
    config["example"] = {}
    preflight_dataset_inputs("example", config)


def test_preflight_blocks_preparation_before_outputs(tmp_path, input_table, contract, monkeypatch):
    from data_pipeline.pipelines import prepare_datasets

    path = str(tmp_path / "input.ht")
    input_table.drop("score").write(path)
    config = configparser.ConfigParser()
    config["example"] = {"input_contract": "example.contract", "results": path}
    monkeypatch.setattr(prepare_datasets, "pipeline_config", config)
    monkeypatch.setattr(
        "data_pipeline.input_validation.importlib.import_module",
        lambda name: SimpleNamespace(INPUT_CONTRACT={"results": contract}),
    )
    output = tmp_path / "outputs"
    with pytest.raises(ValueError, match="Missing: row.score"):
        prepare_datasets.prepare_dataset("example", True, str(output))
    assert not output.exists()


def test_preflight_only_does_not_prepare_outputs(monkeypatch):
    from data_pipeline.pipelines import prepare_datasets

    config = configparser.ConfigParser()
    config["datasets"] = {"datasets": "example"}
    monkeypatch.setattr(prepare_datasets, "pipeline_config", config)
    monkeypatch.setattr("sys.argv", ["prepare_datasets", "--datasets", "example", "--preflight-only"])
    monkeypatch.setattr(hl, "init", lambda **kwargs: None)
    checked = []
    monkeypatch.setattr(prepare_datasets, "preflight_dataset_inputs", lambda dataset, config: checked.append(dataset))
    monkeypatch.setattr(prepare_datasets, "get_output_root", lambda location: "unused")
    monkeypatch.setattr(prepare_datasets, "prepare_dataset", lambda *args: pytest.fail("Unexpected preparation"))
    prepare_datasets.main()
    assert checked == ["example"]
