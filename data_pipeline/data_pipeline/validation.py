import hail as hl


ALLOWED_RESULT_TYPES = {hl.tbool, hl.tfloat32, hl.tfloat64, hl.tint32, hl.tint64, hl.tstr}


def validate_gene_results_table(ds):
    assert ds.key.dtype.fields == ("gene_id",), "Table must be keyed by gene ID"

    assert "group_results" in ds.row_value.dtype.fields, "Table must have a 'group_results' field"

    assert isinstance(ds.group_results.dtype, hl.tdict), "'group_results' must be a dict"

    assert ds.group_results.dtype.key_type == hl.tstr, "'group_results' keys must be strings"

    assert isinstance(ds.group_results.dtype.value_type, hl.tstruct), "'group_results' value must be a struct"

    for typ in ds.group_results.dtype.value_type.types:
        assert (
            typ in ALLOWED_RESULT_TYPES
        ), f"'group_results' fields may only be one of {', '.join(map(str, ALLOWED_RESULT_TYPES))}"


def validate_variant_results_table(ds):
    assert ds.key.dtype.fields == ("locus", "alleles"), "Table must be keyed by locus and alleles"
    assert ds.locus.dtype in (hl.tlocus("GRCh37"), hl.tlocus("GRCh38")), "'locus' must be a locus type"
    assert ds.alleles.dtype == hl.tarray(hl.tstr), "'alleles' must be an array of strings"

    required_fields = {
        "gene_id": hl.tstr,
        "consequence": hl.tstr,
        "hgvsc": hl.tstr,
        "hgvsp": hl.tstr,
    }
    for field, typ in required_fields.items():
        assert field in ds.row_value.dtype.fields, f"Missing required field '{field}'"
        assert ds[field].dtype == typ, f"{field} should be type {typ}"

    assert "group_results" in ds.row_value.dtype.fields, "Table must have a 'group_results' field"
    assert isinstance(ds.group_results.dtype, hl.tdict), "'group_results' must be a dict"
    assert ds.group_results.dtype.key_type == hl.tstr, "'group_results' keys must be strings"
    assert isinstance(ds.group_results.dtype.value_type, hl.tstruct), "'group_results' value must be a struct"

    for typ in ds.group_results.dtype.value_type.types:
        assert (
            typ in ALLOWED_RESULT_TYPES
        ), f"'group_results' fields may only be one of {', '.join(map(str, ALLOWED_RESULT_TYPES))}"

    assert isinstance(ds.info.dtype, hl.tstruct), "'info' must be a struct"
    for typ in ds.info.dtype.types:
        assert (
            typ in ALLOWED_RESULT_TYPES
        ), f"'info' fields may only be one of {', '.join(map(str, ALLOWED_RESULT_TYPES))}"
