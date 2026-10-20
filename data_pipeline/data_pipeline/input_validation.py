import importlib
from dataclasses import dataclass, field
from typing import Mapping

import hail as hl


@dataclass(frozen=True)
class InputTableContract:
    row_schema: hl.tstruct
    key: tuple[str, ...] = ()
    global_schema: hl.tstruct = field(default_factory=hl.tstruct)
    categorical_values: Mapping[str, frozenset[str]] = field(default_factory=dict)
    row_count: int | None = None


def _schema_differences(actual, expected, location):
    if isinstance(actual, hl.tstruct) and isinstance(expected, hl.tstruct):
        differences = []
        for name in sorted(set(actual.fields) | set(expected.fields)):
            path = f"{location}.{name}"
            if name not in actual.fields:
                differences.append(f"Missing: {path} (expected {expected[name]})")
            elif name not in expected.fields:
                differences.append(f"Added: {path} ({actual[name]})")
            else:
                differences.extend(_schema_differences(actual[name], expected[name], path))
        return differences
    if type(actual) is type(expected):
        if isinstance(actual, (hl.tarray, hl.tset)):
            return _schema_differences(actual.element_type, expected.element_type, f"{location}[]")
        if isinstance(actual, hl.tdict):
            return _schema_differences(actual.key_type, expected.key_type, f"{location}.key") + _schema_differences(
                actual.value_type, expected.value_type, f"{location}.value"
            )
    if actual != expected:
        return [f"Changed: {location}: {expected} -> {actual}"]
    return []


def validate_input_tables(dataset_id, paths, contracts):
    inputs = []
    errors = []
    for name, contract in contracts.items():
        path = paths[name]
        label = f"{dataset_id} {name} ({path})"
        print(f"Checking input schema: {label}", flush=True)
        table = hl.read_table(path)
        differences = _schema_differences(table.row.dtype, contract.row_schema, "row")
        differences.extend(_schema_differences(table.globals.dtype, contract.global_schema, "globals"))
        if table.key.dtype.fields != contract.key:
            differences.append(f"Changed: key: {contract.key} -> {table.key.dtype.fields}")
        for field_name in contract.categorical_values:
            if contract.row_schema[field_name] != hl.tstr:
                raise ValueError(f"{label}: categorical field {field_name} must have type str in the contract")
        if differences:
            errors.append(f"{label}:\n  " + "\n  ".join(differences))
        inputs.append((label, table, contract))
    if errors:
        raise ValueError("Input preflight failed:\n" + "\n".join(errors))

    for label, table, contract in inputs:
        if contract.row_count is None and not contract.categorical_values:
            continue
        print(f"Checking input values and row count: {label}", flush=True)
        stats = table.aggregate(
            hl.struct(
                row_count=hl.agg.count(),
                categories=hl.struct(
                    **{name: hl.agg.collect_as_set(table[name]) for name in contract.categorical_values}
                ),
            )
        )
        if contract.row_count is not None and stats.row_count != contract.row_count:
            print(
                f"WARNING: {label} row count changed: previous={contract.row_count:,}; current={stats.row_count:,}",
                flush=True,
            )
        for name, expected in contract.categorical_values.items():
            actual = stats.categories[name]
            if actual != expected:
                errors.append(
                    f"{label}: {name}: missing values={sorted(expected - actual, key=str)!r}; "
                    f"unexpected values={sorted(actual - expected, key=str)!r}"
                )
    if errors:
        raise ValueError("Input preflight failed:\n" + "\n".join(errors))
    print(f"{dataset_id}: input preflight passed", flush=True)


def preflight_dataset_inputs(dataset_id, config):
    module_name = config.get(dataset_id, "input_contract", fallback=None)
    if module_name is None:
        print(f"{dataset_id}: no input contract configured; skipping preflight", flush=True)
        return
    contracts = importlib.import_module(module_name).INPUT_CONTRACT
    paths = {name: config.get(dataset_id, name) for name in contracts}
    validate_input_tables(dataset_id, paths, contracts)
