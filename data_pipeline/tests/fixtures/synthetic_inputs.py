"""Synthetic stand-ins for the Hail tables that ``prepare_gene_models`` and
``prepare_datasets`` produce.

Those two steps read private GCS inputs with no injection seam, so they cannot
run in CI. ``combine_datasets`` and ``write_results_files`` read only the
``.ht`` files those steps leave behind, and the shape of those files is pinned
by ``data_pipeline.validation``. So the intermediates are synthesised here and
the two downstream steps are exercised end to end against them.

Layout written under ``root``::

    <root>/gene_models/<OUTPUT_DATE>/gene_models.ht
    <root>/testa/<OUTPUT_DATE>/{gene_results.ht,variant_results.ht}
    <root>/testb/<OUTPUT_DATE>/{gene_results.ht,variant_results.ht}
    <root>/testclinvar/<OUTPUT_DATE>/{gene_results.ht,variant_results.ht}

The three datasets are deliberately dissimilar, because per-dataset schema
independence is part of the contract: ``TestA`` is a multi-group GRCh38 dataset,
``TestB`` is a single-group *GRCh37* dataset with entirely different field names
and types, and ``TestClinVar`` is a variant-track-only pseudo-dataset with dummy
gene results.
"""

import os

import hail as hl

from data_pipeline.validation import validate_gene_results_table, validate_variant_results_table

OUTPUT_DATE = "TEST"

DATASET_IDS = ["TestA", "TestB", "TestClinVar"]

# The last three digits are the output shard, so expected paths are readable by eye.
BOTH_GENE = "ENSG00000000101"
GRCH37_ONLY_GENE = "ENSG00000000202"
GRCH38_ONLY_GENE = "ENSG00000000303"
SPARSE_GENE = "ENSG00000000404"
PAR_GENE = "ENSGR0000000505"

GENE_IDS = [BOTH_GENE, GRCH37_ONLY_GENE, GRCH38_ONLY_GENE, SPARSE_GENE, PAR_GENE]


# --------------------------------------------------------------------------- #
# gene_models.ht
# --------------------------------------------------------------------------- #

EXONS_TYPE = hl.tarray(hl.tstruct(feature_type=hl.tstr, start=hl.tint32, stop=hl.tint32))

ASSEMBLY_TYPE = hl.tstruct(
    chrom=hl.tstr,
    strand=hl.tstr,
    start=hl.tint32,
    stop=hl.tint32,
    gencode_gene_symbol=hl.tstr,
    canonical_transcript_id=hl.tstr,
    canonical_transcript=hl.tstruct(
        transcript_id=hl.tstr,
        strand=hl.tstr,
        start=hl.tint32,
        stop=hl.tint32,
        exons=EXONS_TYPE,
    ),
)

EXAC_CONSTRAINT_TYPE = hl.tstruct(
    exp_syn=hl.tfloat64,
    exp_mis=hl.tfloat64,
    exp_lof=hl.tfloat64,
    obs_syn=hl.tint32,
    obs_mis=hl.tint32,
    obs_lof=hl.tint32,
    mu_syn=hl.tfloat64,
    mu_mis=hl.tfloat64,
    mu_lof=hl.tfloat64,
    syn_z=hl.tfloat64,
    mis_z=hl.tfloat64,
    lof_z=hl.tfloat64,
    pLI=hl.tfloat64,
)

GNOMAD_CONSTRAINT_TYPE = hl.tstruct(
    exp_lof=hl.tfloat64,
    exp_mis=hl.tfloat64,
    exp_syn=hl.tfloat64,
    obs_lof=hl.tint64,
    obs_mis=hl.tint64,
    obs_syn=hl.tint64,
    oe_lof=hl.tfloat64,
    oe_mis=hl.tfloat64,
    oe_syn=hl.tfloat64,
    lof_z=hl.tfloat64,
    mis_z=hl.tfloat64,
    syn_z=hl.tfloat64,
    pLI=hl.tfloat64,
)

GENE_MODELS_TYPE = hl.tstruct(
    gene_id=hl.tstr,
    GRCh37=ASSEMBLY_TYPE,
    GRCh38=ASSEMBLY_TYPE,
    hgnc_id=hl.tstr,
    symbol=hl.tstr,
    name=hl.tstr,
    previous_symbols=hl.tarray(hl.tstr),
    alias_symbols=hl.tarray(hl.tstr),
    omim_id=hl.tstr,
    search_terms=hl.tset(hl.tstr),
    exac_constraint=EXAC_CONSTRAINT_TYPE,
    gnomad_v2_constraint=GNOMAD_CONSTRAINT_TYPE,
    gnomad_v4_constraint=GNOMAD_CONSTRAINT_TYPE,
)

EXAC_CONSTRAINT = {
    "exp_syn": 10.5,
    "exp_mis": 20.25,
    "exp_lof": 1.75,
    "obs_syn": 11,
    "obs_mis": 19,
    "obs_lof": 0,
    "mu_syn": 1e-06,
    "mu_mis": 2e-06,
    "mu_lof": 3e-07,
    "syn_z": 0.5,
    "mis_z": 1.5,
    "lof_z": 2.5,
    "pLI": 0.99,
}

GNOMAD_CONSTRAINT = {
    "exp_lof": 3.5,
    "exp_mis": 30.5,
    "exp_syn": 15.5,
    "obs_lof": 1,
    "obs_mis": 28,
    "obs_syn": 16,
    "oe_lof": 0.2857,
    "oe_mis": 0.918,
    "oe_syn": 1.032,
    "lof_z": 1.1,
    "mis_z": 0.2,
    "syn_z": -0.1,
    "pLI": 0.85,
}


def _assembly(chrom, start, stop, gencode_symbol, transcript_id):
    return {
        "chrom": chrom,
        "strand": "+",
        "start": start,
        "stop": stop,
        "gencode_gene_symbol": gencode_symbol,
        "canonical_transcript_id": transcript_id,
        "canonical_transcript": {
            "transcript_id": transcript_id,
            "strand": "+",
            "start": start,
            "stop": stop,
            "exons": [
                {"feature_type": "CDS", "start": start, "stop": start + 100},
                {"feature_type": "CDS", "start": stop - 100, "stop": stop},
            ],
        },
    }


def _search_terms(symbol, previous_symbols, alias_symbols, gencode_symbols):
    terms = [symbol, *previous_symbols, *alias_symbols, *gencode_symbols]
    return {term.upper() for term in terms if term is not None}


def _gene_models_rows():
    return [
        # Baseline: present in every dataset, on both assemblies, with previous
        # and alias symbols so search term assembly is exercised. GRCh37 and
        # GRCh38 midpoints differ, which is what makes the reference genome used
        # by results/<dataset>.json observable.
        {
            "gene_id": BOTH_GENE,
            "GRCh37": _assembly("1", 100_000, 101_000, "BOTHGENE", "ENST00000000101"),
            "GRCh38": _assembly("1", 200_000, 203_000, "BOTHGENE", "ENST00000000101"),
            "hgnc_id": "HGNC:101",
            "symbol": "BOTHGENE",
            "name": "both assemblies gene",
            "previous_symbols": ["OLDBOTH"],
            "alias_symbols": ["ALIASBOTH", "both2"],
            "omim_id": "600101",
            "search_terms": _search_terms("BOTHGENE", ["OLDBOTH"], ["ALIASBOTH", "both2"], ["BOTHGENE"]),
            "exac_constraint": EXAC_CONSTRAINT,
            "gnomad_v2_constraint": GNOMAD_CONSTRAINT,
            "gnomad_v4_constraint": GNOMAD_CONSTRAINT,
        },
        # GRCh37-only side of the gene models outer join. Must produce a
        # _GRCh37.json and no _GRCh38.json. gnomAD v4 constraint keys off the
        # GRCh38 transcript, so it is missing here, as in the real pipeline.
        {
            "gene_id": GRCH37_ONLY_GENE,
            "GRCh37": _assembly("2", 300_000, 300_500, "G37ONLY", "ENST00000000202"),
            "GRCh38": None,
            "hgnc_id": "HGNC:202",
            "symbol": "G37ONLY",
            "name": "GRCh37 only gene",
            "previous_symbols": [],
            "alias_symbols": [],
            "omim_id": None,
            "search_terms": _search_terms("G37ONLY", [], [], ["G37ONLY"]),
            "exac_constraint": EXAC_CONSTRAINT,
            "gnomad_v2_constraint": GNOMAD_CONSTRAINT,
            "gnomad_v4_constraint": None,
        },
        # Mirror case: GRCh38 only, so the GRCh37-keyed constraints are missing.
        {
            "gene_id": GRCH38_ONLY_GENE,
            "GRCh37": None,
            "GRCh38": _assembly("3", 400_000, 400_500, "G38ONLY", "ENST00000000303"),
            "hgnc_id": "HGNC:303",
            "symbol": "G38ONLY",
            "name": "GRCh38 only gene",
            "previous_symbols": [],
            "alias_symbols": [],
            "omim_id": None,
            "search_terms": _search_terms("G38ONLY", [], [], ["G38ONLY"]),
            "exac_constraint": None,
            "gnomad_v2_constraint": None,
            "gnomad_v4_constraint": GNOMAD_CONSTRAINT,
        },
        # Absent from TestB entirely, and all constraint structs null, so null
        # pass-through and the empty-variant-array path are both covered.
        {
            "gene_id": SPARSE_GENE,
            "GRCh37": _assembly("1", 500_000, 500_500, "SPARSEGENE", "ENST00000000404"),
            "GRCh38": _assembly("1", 500_000, 500_500, "SPARSEGENE", "ENST00000000404"),
            "hgnc_id": "HGNC:404",
            "symbol": "SPARSEGENE",
            "name": "sparse gene",
            "previous_symbols": [],
            "alias_symbols": [],
            "omim_id": None,
            "search_terms": _search_terms("SPARSEGENE", [], [], ["SPARSEGENE"]),
            "exac_constraint": None,
            "gnomad_v2_constraint": None,
            "gnomad_v4_constraint": None,
        },
        # Pseudoautosomal-style ID. Locks the two independent shard
        # implementations against each other: int(gene_id.lstrip("ENSGR")) % 1000
        # in write_results_files.py and Number(geneId.replace(/^ENSGR?/, '')) % 1000
        # in src/server/server.ts.
        {
            "gene_id": PAR_GENE,
            "GRCh37": _assembly("X", 600_000, 600_500, "PARGENE", "ENST00000000505"),
            "GRCh38": _assembly("X", 600_000, 600_500, "PARGENE", "ENST00000000505"),
            "hgnc_id": "HGNC:505",
            "symbol": "PARGENE",
            "name": "pseudoautosomal gene",
            "previous_symbols": [],
            "alias_symbols": [],
            "omim_id": None,
            "search_terms": _search_terms("PARGENE", [], [], ["PARGENE"]),
            "exac_constraint": EXAC_CONSTRAINT,
            "gnomad_v2_constraint": GNOMAD_CONSTRAINT,
            "gnomad_v4_constraint": GNOMAD_CONSTRAINT,
        },
    ]


# --------------------------------------------------------------------------- #
# Per-dataset gene_results.ht
# --------------------------------------------------------------------------- #

# Spans every type validation.py permits: str, int32, int64, float32, float64, bool.
TESTA_GENE_GROUP_TYPE = hl.tstruct(
    n_cases=hl.tint32,
    n_controls=hl.tint64,
    p_value=hl.tfloat64,
    odds_ratio=hl.tfloat32,
    category=hl.tstr,
    is_significant=hl.tbool,
)

TESTB_GENE_GROUP_TYPE = hl.tstruct(qval=hl.tfloat64, n_denovo=hl.tint32, cohort=hl.tstr)

TESTCLINVAR_GENE_GROUP_TYPE = hl.tstruct(dummy_value=hl.tint32)


def _testa_gene_group(n_cases, n_controls, p_value, odds_ratio, category, is_significant):
    return {
        "n_cases": n_cases,
        "n_controls": n_controls,
        "p_value": p_value,
        "odds_ratio": odds_ratio,
        "category": category,
        "is_significant": is_significant,
    }


def _testa_gene_results_rows():
    return [
        {
            "gene_id": BOTH_GENE,
            "group_results": {
                "case_control": _testa_gene_group(100, 200, 1.5e-08, 2.5, "ptv", True),
                "meta": _testa_gene_group(150, 300, 3.25e-06, 1.75, "ptv", True),
            },
        },
        {
            "gene_id": GRCH37_ONLY_GENE,
            "group_results": {
                "case_control": _testa_gene_group(10, 20, 0.5, 1.0, "missense", False),
                "meta": _testa_gene_group(15, 30, 0.25, 1.1, "missense", False),
            },
        },
        {
            "gene_id": GRCH38_ONLY_GENE,
            "group_results": {
                "case_control": _testa_gene_group(1, 2, 1.23456789e-13, 9.5, "ptv", True),
                "meta": _testa_gene_group(2, 4, 0.99999999, 1.0, "ptv", False),
            },
        },
        # One null per type, since nulls flow through into the positional tuples.
        {
            "gene_id": SPARSE_GENE,
            "group_results": {
                "case_control": _testa_gene_group(None, None, None, None, None, None),
                "meta": _testa_gene_group(0, 0, 1.0, 0.0, "", False),
            },
        },
        {
            "gene_id": PAR_GENE,
            "group_results": {
                "case_control": _testa_gene_group(7, 14, 0.05, 1.5, "synonymous", False),
                "meta": _testa_gene_group(7, 14, 0.05, 1.5, "synonymous", False),
            },
        },
    ]


def _testb_gene_results_rows():
    # SPARSE_GENE is deliberately absent, so gene_results.TestB is a missing
    # struct for it and it drops out of results/testb.json.
    return [
        {"gene_id": BOTH_GENE, "group_results": {"All": {"qval": 0.001, "n_denovo": 4, "cohort": "combined"}}},
        {"gene_id": GRCH37_ONLY_GENE, "group_results": {"All": {"qval": 0.2, "n_denovo": 0, "cohort": "combined"}}},
        {"gene_id": GRCH38_ONLY_GENE, "group_results": {"All": {"qval": None, "n_denovo": None, "cohort": None}}},
        {"gene_id": PAR_GENE, "group_results": {"All": {"qval": 0.75, "n_denovo": 1, "cohort": "trios"}}},
    ]


def _testclinvar_gene_results_rows():
    # Mirrors clinvar_grch38_dummy_genes: gene results exist only to satisfy the
    # combine step and are ignored by the frontend.
    return [{"gene_id": BOTH_GENE, "group_results": {"dummy": {"dummy_value": 0}}}]


# --------------------------------------------------------------------------- #
# Per-dataset variant_results.ht
# --------------------------------------------------------------------------- #

TESTA_VARIANT_GROUP_TYPE = hl.tstruct(
    ac_case=hl.tint32,
    an_case=hl.tint64,
    af_case=hl.tfloat64,
    p_value=hl.tfloat32,
    quality_flag=hl.tstr,
    is_pass=hl.tbool,
)

TESTA_VARIANT_INFO_TYPE = hl.tstruct(
    cadd=hl.tfloat64,
    revel=hl.tfloat32,
    n_carriers=hl.tint32,
    in_analysis=hl.tbool,
    flags=hl.tstr,
)

TESTB_VARIANT_GROUP_TYPE = hl.tstruct(qval=hl.tfloat64, n_denovo=hl.tint32, cohort=hl.tstr)

TESTB_VARIANT_INFO_TYPE = hl.tstruct(consequence_score=hl.tfloat32, in_gnomad=hl.tbool)

TESTCLINVAR_VARIANT_GROUP_TYPE = hl.tstruct(clinical_significance=hl.tstr, gold_stars=hl.tint32)

TESTCLINVAR_VARIANT_INFO_TYPE = hl.tstruct(review_status=hl.tstr)


def _testa_variant_group(ac_case, an_case, af_case, p_value, quality_flag, is_pass):
    return {
        "ac_case": ac_case,
        "an_case": an_case,
        "af_case": af_case,
        "p_value": p_value,
        "quality_flag": quality_flag,
        "is_pass": is_pass,
    }


def _testa_variant_results_rows():
    grch38 = "GRCh38"
    return [
        # Written with positions descending within a gene, to prove nothing
        # downstream depends on input order.
        {
            "locus": hl.locus("chr1", 200_500, reference_genome=grch38),
            "alleles": ["A", "G"],
            "gene_id": BOTH_GENE,
            "consequence": "missense_variant",
            "hgvsc": "c.100A>G",
            "hgvsp": "p.Lys34Arg",
            "group_results": {
                "case_control": _testa_variant_group(3, 1000, 0.003, 0.04, "PASS", True),
                "meta": _testa_variant_group(5, 2000, 0.0025, 0.02, "PASS", True),
            },
            "info": {
                "cadd": 24.5,
                "revel": 0.75,
                "n_carriers": 3,
                "in_analysis": True,
                "flags": "",
            },
        },
        # Deletion: multi-character reference allele in the variant ID.
        {
            "locus": hl.locus("chr1", 200_400, reference_genome=grch38),
            "alleles": ["CTTG", "C"],
            "gene_id": BOTH_GENE,
            "consequence": "frameshift_variant",
            "hgvsc": "c.90_92del",
            "hgvsp": "p.Leu30fs",
            "group_results": {
                "case_control": _testa_variant_group(1, 1000, 0.001, 0.5, "PASS", True),
                "meta": _testa_variant_group(1, 2000, 0.0005, 0.6, "PASS", True),
            },
            "info": {
                "cadd": 33.0,
                "revel": None,
                "n_carriers": 1,
                "in_analysis": True,
                "flags": "lcr",
            },
        },
        # Insertion, null HGVS strings, and no "meta" group result: the
        # or_missing branch in combine_datasets must emit a null tuple.
        {
            "locus": hl.locus("chr1", 200_300, reference_genome=grch38),
            "alleles": ["A", "ATTT"],
            "gene_id": BOTH_GENE,
            "consequence": "inframe_insertion",
            "hgvsc": None,
            "hgvsp": None,
            "group_results": {"case_control": _testa_variant_group(2, 998, 0.002, None, None, None)},
            "info": {
                "cadd": None,
                "revel": None,
                "n_carriers": None,
                "in_analysis": False,
                "flags": None,
            },
        },
        # NaN and +/-Infinity, which ResultEncoder maps to strings.
        {
            "locus": hl.locus("chr2", 300_100, reference_genome=grch38),
            "alleles": ["C", "T"],
            "gene_id": GRCH37_ONLY_GENE,
            "consequence": "synonymous_variant",
            "hgvsc": "c.30C>T",
            "hgvsp": "p.=",
            "group_results": {
                "case_control": _testa_variant_group(0, 500, float("nan"), float("inf"), "FAIL", False),
                "meta": _testa_variant_group(0, 1000, float("-inf"), float("nan"), "FAIL", False),
            },
            "info": {
                "cadd": float("nan"),
                "revel": float("inf"),
                "n_carriers": 0,
                "in_analysis": False,
                "flags": "monoallelic",
            },
        },
        # Float precision, locking ResultEncoder's "{:.5g}" formatting.
        {
            "locus": hl.locus("chr3", 400_100, reference_genome=grch38),
            "alleles": ["G", "A"],
            "gene_id": GRCH38_ONLY_GENE,
            "consequence": "stop_gained",
            "hgvsc": "c.10G>A",
            "hgvsp": "p.Trp4Ter",
            "group_results": {
                "case_control": _testa_variant_group(1, 400, 1.23456789e-13, 1.2345678e-13, "PASS", True),
                "meta": _testa_variant_group(1, 800, 0.1234567890123, 0.12345678, "PASS", True),
            },
            "info": {
                "cadd": 987654321.123456,
                "revel": 0.123456789,
                "n_carriers": 1,
                "in_analysis": True,
                "flags": "",
            },
        },
        {
            "locus": hl.locus("chr1", 500_100, reference_genome=grch38),
            "alleles": ["T", "C"],
            "gene_id": SPARSE_GENE,
            "consequence": "missense_variant",
            "hgvsc": "c.5T>C",
            "hgvsp": "p.Val2Ala",
            "group_results": {
                "case_control": _testa_variant_group(1, 100, 0.01, 0.9, "PASS", True),
                "meta": _testa_variant_group(1, 200, 0.005, 0.8, "PASS", True),
            },
            "info": {
                "cadd": 12.25,
                "revel": 0.5,
                "n_carriers": 1,
                "in_analysis": True,
                "flags": "",
            },
        },
        {
            "locus": hl.locus("chrX", 600_100, reference_genome=grch38),
            "alleles": ["G", "T"],
            "gene_id": PAR_GENE,
            "consequence": "splice_donor_variant",
            "hgvsc": "c.1+1G>T",
            "hgvsp": None,
            "group_results": {
                "case_control": _testa_variant_group(2, 300, 0.006667, 0.3, "PASS", True),
                "meta": _testa_variant_group(2, 600, 0.003333, 0.25, "PASS", True),
            },
            "info": {
                "cadd": 30.0,
                "revel": None,
                "n_carriers": 2,
                "in_analysis": True,
                "flags": "",
            },
        },
    ]


def _testb_variant_results_rows():
    # GRCh37, so contigs have no "chr" prefix: the other side of the
    # contig.replace("^chr", "") behaviour that TestA covers.
    grch37 = "GRCh37"
    return [
        {
            "locus": hl.locus("1", 100_200, reference_genome=grch37),
            "alleles": ["G", "C"],
            "gene_id": BOTH_GENE,
            "consequence": "missense_variant",
            "hgvsc": "c.200G>C",
            "hgvsp": "p.Gly67Ala",
            "group_results": {"All": {"qval": 0.02, "n_denovo": 2, "cohort": "trios"}},
            "info": {"consequence_score": 0.8, "in_gnomad": True},
        },
        {
            "locus": hl.locus("1", 100_100, reference_genome=grch37),
            "alleles": ["AT", "A"],
            "gene_id": BOTH_GENE,
            "consequence": "frameshift_variant",
            "hgvsc": None,
            "hgvsp": None,
            "group_results": {"All": {"qval": None, "n_denovo": 1, "cohort": None}},
            "info": {"consequence_score": None, "in_gnomad": False},
        },
        {
            "locus": hl.locus("2", 300_200, reference_genome=grch37),
            "alleles": ["T", "TA"],
            "gene_id": GRCH37_ONLY_GENE,
            "consequence": "inframe_insertion",
            "hgvsc": "c.50_51insA",
            "hgvsp": "p.Ile17dup",
            "group_results": {"All": {"qval": 0.9, "n_denovo": 0, "cohort": "trios"}},
            "info": {"consequence_score": 0.1, "in_gnomad": True},
        },
    ]


def _testclinvar_variant_results_rows():
    grch38 = "GRCh38"
    return [
        # Same locus and alleles as a TestA variant: datasets must stay
        # independent rather than colliding.
        {
            "locus": hl.locus("chr1", 200_500, reference_genome=grch38),
            "alleles": ["A", "G"],
            "gene_id": BOTH_GENE,
            "consequence": "missense_variant",
            "hgvsc": "c.100A>G",
            "hgvsp": "p.Lys34Arg",
            "group_results": {"All": {"clinical_significance": "Pathogenic", "gold_stars": 3}},
            "info": {"review_status": "reviewed by expert panel"},
        },
        {
            "locus": hl.locus("chr1", 200_600, reference_genome=grch38),
            "alleles": ["C", "G"],
            "gene_id": BOTH_GENE,
            "consequence": "stop_gained",
            "hgvsc": "c.200C>G",
            "hgvsp": "p.Ser67Ter",
            "group_results": {"All": {"clinical_significance": "Uncertain significance", "gold_stars": None}},
            "info": {"review_status": None},
        },
    ]


DATASETS = {
    "TestA": {
        "gene_results": (_testa_gene_results_rows, TESTA_GENE_GROUP_TYPE),
        "variant_results": (_testa_variant_results_rows, "GRCh38", TESTA_VARIANT_GROUP_TYPE, TESTA_VARIANT_INFO_TYPE),
    },
    "TestB": {
        "gene_results": (_testb_gene_results_rows, TESTB_GENE_GROUP_TYPE),
        "variant_results": (_testb_variant_results_rows, "GRCh37", TESTB_VARIANT_GROUP_TYPE, TESTB_VARIANT_INFO_TYPE),
    },
    "TestClinVar": {
        "gene_results": (_testclinvar_gene_results_rows, TESTCLINVAR_GENE_GROUP_TYPE),
        "variant_results": (
            _testclinvar_variant_results_rows,
            "GRCh38",
            TESTCLINVAR_VARIANT_GROUP_TYPE,
            TESTCLINVAR_VARIANT_INFO_TYPE,
        ),
    },
}


def _write_gene_models(root):
    table = hl.Table.parallelize(_gene_models_rows(), schema=GENE_MODELS_TYPE, n_partitions=2)
    table = table.key_by("gene_id")
    table.write(os.path.join(root, "gene_models", OUTPUT_DATE, "gene_models.ht"), overwrite=True)


def _write_gene_results(dataset_path, rows, group_type):
    schema = hl.tstruct(gene_id=hl.tstr, group_results=hl.tdict(hl.tstr, group_type))
    table = hl.Table.parallelize(rows(), schema=schema, n_partitions=2)
    table = table.key_by("gene_id")
    validate_gene_results_table(table)
    table.write(os.path.join(dataset_path, "gene_results.ht"), overwrite=True)


def _write_variant_results(dataset_path, rows, reference_genome, group_type, info_type):
    schema = hl.tstruct(
        locus=hl.tlocus(reference_genome),
        alleles=hl.tarray(hl.tstr),
        gene_id=hl.tstr,
        consequence=hl.tstr,
        hgvsc=hl.tstr,
        hgvsp=hl.tstr,
        group_results=hl.tdict(hl.tstr, group_type),
        info=info_type,
    )
    table = hl.Table.parallelize(rows(), schema=schema, n_partitions=2)
    table = table.key_by("locus", "alleles")
    validate_variant_results_table(table)
    table.write(os.path.join(dataset_path, "variant_results.ht"), overwrite=True)


def build_synthetic_inputs(root):
    """Write the synthetic ``gene_models.ht`` and per-dataset tables under ``root``."""
    root = str(root)
    _write_gene_models(root)

    for dataset_id, spec in DATASETS.items():
        dataset_path = os.path.join(root, dataset_id.lower(), OUTPUT_DATE)
        _write_gene_results(dataset_path, *spec["gene_results"])
        _write_variant_results(dataset_path, *spec["variant_results"])

    return root
