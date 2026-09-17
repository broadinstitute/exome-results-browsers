"""Canonicalize a results directory so it can be compared byte for byte.

The pipeline's JSON output has a few kinds of incidental variation that carry no
meaning for consumers:

* object key order, which follows Hail's field order;
* Hail ``set`` fields (``search_terms``), which have no defined order;
* per-gene variant arrays and per-dataset result arrays, whose order depends on
  partitioning (the frontend sorts both client-side).

Those are normalised. Everything else is left exactly as written, in particular:

* numbers are reproduced verbatim from the source text, because
  ``ResultEncoder``'s ``"{:.5g}"`` formatting and its ``"NaN"`` / ``"Infinity"``
  strings are observable by the frontend and are part of the contract under test;
* the positional ``group_results`` tuples, and the ``*_field_names`` /
  ``*_field_types`` / ``*_analysis_groups`` arrays in ``metadata.json``, are
  *not* sorted. Their order is the contract the frontend indexes into, so a
  reordering there is a real failure and must show up as a diff.

Hail ``.ht`` directories are never compared: they carry partition layouts,
version stamps and timestamps.
"""

import json
from pathlib import Path

MANIFEST_FILENAME = "MANIFEST.txt"

_GENE_SEARCH_TERMS_FILE = "gene_search_terms.json.txt"


class _Number(str):
    """A JSON number, kept as the exact text it was parsed from."""


def _loads(text):
    return json.loads(text, parse_float=_Number, parse_int=_Number, parse_constant=_Number)


def _dumps(value, level=0):
    pad = "  " * level
    inner = "  " * (level + 1)

    if isinstance(value, _Number):
        return str(value)
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, str):
        return json.dumps(value)
    if isinstance(value, list):
        if not value:
            return "[]"
        items = ",\n".join(inner + _dumps(item, level + 1) for item in value)
        return f"[\n{items}\n{pad}]"
    if isinstance(value, dict):
        if not value:
            return "{}"
        items = ",\n".join(f"{inner}{json.dumps(key)}: {_dumps(value[key], level + 1)}" for key in sorted(value))
        return f"{{\n{items}\n{pad}}}"

    raise TypeError(f"unexpected JSON value of type {type(value).__name__}")


def _row_sort_key(row):
    """Sort key for a positional result/variant tuple, whose element 0 is an ID."""
    identifier = row[0]
    return (identifier is None, identifier or "")


def _canonicalize_gene_search_terms(text):
    entries = [_loads(line) for line in text.splitlines() if line.strip()]
    for entry in entries:
        entry[1] = sorted(entry[1])
    entries.sort(key=_row_sort_key)
    return "".join(f"{_dumps(entry)}\n" for entry in entries)


def canonicalize_text(relative_path, text):
    """Return the canonical form of one pipeline output file."""
    if relative_path == _GENE_SEARCH_TERMS_FILE:
        return _canonicalize_gene_search_terms(text)

    data = _loads(text)

    if relative_path.startswith("results/"):
        data["results"] = sorted(data["results"], key=_row_sort_key)
    elif relative_path.endswith("_variants.json"):
        data["variants"] = sorted(data["variants"], key=_row_sort_key)
    elif "search_terms" in data.get("gene", {}):
        data["gene"]["search_terms"] = sorted(data["gene"]["search_terms"])

    return _dumps(data) + "\n"


def relative_output_paths(directory):
    """Every output file under ``directory``, as sorted POSIX-style relative paths."""
    directory = Path(directory)
    paths = (path for path in directory.rglob("*") if path.is_file())
    return sorted(path.relative_to(directory).as_posix() for path in paths)


def canonicalize_directory(directory):
    """Map each output file's relative path to its canonical text."""
    directory = Path(directory)
    return {
        relative_path: canonicalize_text(relative_path, (directory / relative_path).read_text(encoding="utf-8"))
        for relative_path in relative_output_paths(directory)
    }


def manifest_text(relative_paths):
    return "".join(f"{path}\n" for path in sorted(relative_paths))
