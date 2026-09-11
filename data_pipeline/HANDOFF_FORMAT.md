# Expected data shape for a new dataset

This file describes the common shapes that analysts hand off as data to our team to create an exome result browser. While there are, and will continue to be, differences between datasets, aiming to hand off data in roughly these shapes, with some key fields of the expected type, will make handoff smoother.

Typically, analysts hand off 3 files to be used in the creation of an exome result browser:

1. variant results
2. variant annotations
3. gene results

For studies with a notion of an 'analysis group', the variant results and gene results table typically have one row for gene/variant PER analysis group. Examples of analysis groups in existing exome results browsers are genetic ancestries in the GP2 browser, or specific types of IBD on the IBD browser. Some browsers, such as SCHEMA, do not have a notion of an 'analysis group'. E.g., if a dataset has 10 genes, but 3 analysis groups, the gene results handoff table would have 30 rows.

The shapes of data described below are format agnostic, we have received data handoffs in `.tsv` format, and `.ht` format. The particular file type matters less than what is contained within it.

## Variant results table

One row per variant, per analysis group. Numbers and statistics related to the variant in this dataset analysis.

```
locus, alleles       # required, e.g. chrom="1", pos=55039465, alleles=["C","T"]
analysis_group       # required, short display label: "meta", "IBD", "PD", see note below*

# common statistics in datasets, conform to these names if possible
ac_case              # allele count in cases, as an integer
an_case              # allele number in cases, as an integer
ac_control           # allele count in controls, as an integer
an_control           # allele number in controls, as an integer
p_value              # significance value for the analysis, as a float.
                     #    sometimes <category>_p_value if there are multiple
in_analysis          # bool, whether this variant was used in the test

# seen in some datasets
odds_ratio           # float, sometimes <category>_odds_ratio
beta                 # float, sometimes <category>_beta
n_de_novo            # de novo count, if reported

# any other statistic you want to include
```

*`analysis_group`: if your dataset has no notion of analysis groups, this can be either left out, or can be set to a single one for all rows, e.g. `meta`, `all`, or something similar


## Variant annotations table

Annotations and information relevant to variants present in the dataset in general.

Genome build should be communicated to us, in the case of a `.ht` this information is included in the `locus` field. Nearly all of the exome results browsers currently use GRCh38.

```
locus, alleles             # required, e.g. chrom="1", pos=55039465, alleles=["C","T"]
ensembl_gene_id            # string, required, Ensembl gene ID, see note below*
consequence                # string, required, most severe VEP consequence term
hgvsc                      # string, required, transcript-relative HGVS
hgvsp                      # string, required, transcript-relative HGVS

# Other fields can be included, and can be used in display e.g.
cadd, revel, sift, polyphen, splice_ai, mpc, ...  # floats, in-silico predictor scores
rsid
clinvar_variation_id, clinical_significance, clinical_significance_category
transcript_id, mane_select
gene_symbol
```

*`ensembl_gene_id`: Our pipeline uses ensembl ids for matching variants to genes, rather than gene symbols.



## Gene results table

One row per gene, per analysis group. Numbers and statistics related to the gene in this dataset analysis.

Genome build should be communicated to us. Nearly all of the exome results browsers currently use GRCh38.

```
ensembl_gene_id        # string, required
analysis_group         # string, required, short display label, see note*
n_cases                # integer, along with n_controls, cohort sizes of the group
n_controls             #     along with n_cases

# common display metrics
<category>_p_value     # float, e.g. syn_p_value, or mis_p_value
<category>_odds_ratio  # float,
<category>_beta        # float,

# optional, for display
het_p_value                        # heterogeneity stat, for meta-analyses
p_<subcohort>, beta_<subcohort>    # per-cohort breakdown feeding a meta-analysis
variant_id, variant_p_value, ...    # most-significant-variant summary, "variant_" prefixed

# any other fields you want displayed
```

*`analysis_group`: if your dataset has no notion of analysis groups, this can be either left out, or can be set to a single one for all rows, e.g. `meta`, `all`, or something similar


## Additional fields, changes in behavior

We realize that every dataset is different, and there will inevitably be differences we need to account for when getting your analysis into a new/existing exome results browser. The sample format of tables above are not completely rigid, if you need something else, we're happy to discuss. Though in general, if it is possible to have the handoff tables conform closely to the formats described above, the process of going from your analysis data to a live exome results browser will be more straightfoward.
