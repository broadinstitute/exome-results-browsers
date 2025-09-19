# Data Pipeline

The data pipeline for the results browsers has 4 main steps.

- `prepare_gene_models` imports gene information from Gencode GTF files, canonical transcript
  lists, and HGNC data into Hail format. It also joins gnomAD and ExAC constraint data.

- `prepare_datasets` runs dataset-specific data pipelines for preparing gene-level and
  variant-level results. It also validates that the dataset-specific pipelines produce
  a Hail table with the schema required for the next step.

- `combine_datasets` combines gene models and results from multiple datasets into one Hail Table.

- `write_results_files` exports combined Hail table to JSON files to be served by API.

The output location of `prepare_gene_models`, `prepare_datasets`, and `combine_datasets` is
controlled by the `output.staging_path` option in `pipeline_config.ini`.

## Configuration

Pipeline configuration is stored in `pipeline_config.ini`.

Configuration is divided into sections:

- `datasets`

  - `datasets` - comma separated list of all datasets

- `reference_data` - paths to data files used by `prepare_gene_models`

  Some files are obtained or computed from external sources.

  - `grch37_gencode_path`

    Copy of ftp://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_19/gencode.v19.annotation.gtf.gz
    compressed with blocked gzip.

  - `grch38_gencode_path`

    Copy of ftp://ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_39/gencode.v39.annotation.gtf.gz
    compressed with blocked gzip.

  - `grch37_canonical_transcripts_path` and `grch38_canonical_transcripts_path`

    Derived from VEP annotations in gnomAD.

    ```python
    gnomad_sites_table.aggregate(
        hl.agg.explode(
            lambda csq: hl.agg.collect_as_set((csq.gene_id, csq.transcript_id)),
            gnomad_sites_table.vep.transcript_consequences.filter(lambda csq: csq.canonical == 1),
        )
    )
    ```

  - `hgnc_path`

    Generated from https://www.genenames.org/download/custom/ including Ensembl gene IDs and OMIM IDs.

    https://www.genenames.org/cgi-bin/download/custom?col=gd_hgnc_id&col=gd_app_sym&col=gd_app_name&col=gd_prev_sym&col=gd_aliases&col=gd_pub_ensembl_id&col=md_ensembl_id&col=md_mim_id&status=Approved&hgnc_dbtag=on&order_by=gd_app_sym_sort&format=text&submit=submit

  - `clinvar_grch37_path`

    Copy of the reduced GRCh37 ClinVar hail table from GeniE
    `gs://aggregate-frequency-calculator-data/ClinVar/ClinVar_GRCh37_variants.ht`

  - `clinvar_grch38_path`

    Copy of the reduced GRCh38 ClinVar hail table from GeniE
    `gs://aggregate-frequency-calculator-data/ClinVar/ClinVar_GRCh38_variants.ht`

  - `dbSNP_grch38_rsids_path`

    Copy of the GRCh38 dbSNP rsid only hail table from Hail's datasets (`gs://hail-datasets-us-central1/..)

- `output`

  - `staging_path` - path of the directory where pipelines should write Hail Tables

    After running data pipelines, this directory will contain:

    ```
    dataset1/
      gene_results.ht
      variant_results.ht
    dataset2/
      gene_results.ht
      variant_results.ht
    ...
    gene_models.ht
    combined.ht
    ```

- `dataproc` - configuration for Dataproc cluster used by `start_dataproc_cluster.py`,
  `stop_dataproc_cluster.py`, and `run_pipeline.py`

  - `project`
  - `region`
  - `zone`

- Other sections contain paths to files for individual datasets and are used by those
  datasets' data preparation pipelines.

## Running pipelines

### Local

To run data pipelines locally, use:

```
./data_pipeline/run_pipeline.py pipeline_name pipeline_args
```

### Dataproc

To run data pipelines on Dataproc, use:

```
./data_pipeline/start_dataproc_cluster.py
./data_pipeline/run_pipeline.py --environment dataproc pipeline_name pipeline_args
./data_pipeline/stop_dataproc_cluster.py
```

Configuration for the Dataproc cluster (GCP project, region, etc.) can be set in the `dataproc`
section of `pipeline_config.ini`.

## Data preparation

- Start Dataproc cluster.

  ```
  ./data_pipeline/start_dataproc_cluster.py
  ```

  The project, region, and zone to use for the cluster can be configured in the `dataproc` section
  of `data_pipeline/pipeline_config.ini`.

- Prepare gene models.

  This takes a few minutes on a default 2 worker cluster.

  ```
  ./data_pipeline/run_pipeline.py --environment dataproc prepare_gene_models
  ```

- Prepare datasets.

  This takes a few minutes per dataset on a default 2 worker cluster.

  ```
  ./data_pipeline/run_pipeline.py --environment dataproc prepare_datasets
  ```

- Prepare downloads.

  This takes less than a minute per dataset on a default 2 worker cluster.

  ```
  ./data_pipeline/run_pipeline.py --environment dataproc prepare_downloads
  ```

- Combine all datasets into one Hail Table.

  This takes 5-10 minutes on a default 2 worker cluster.

  ```
  ./data_pipeline/run_pipeline.py --environment dataproc combine_datasets
  ```

- Stop Dataproc cluster.

  ```
  ./data_pipeline/stop_dataproc_cluster.py
  ```

## Results files

The combined Hail Table must be exported to JSON files which are served by the API. This is done
by the `write_results_files.py` script.

```
./write_results_files.py /path/to/combined.ht /path/to/output/directory
```

**Note** `write_results_files.py` writes a few hundred thousand files: 2 per gene (GRCh37 and GRCh38
versions of the gene) and 1 per dataset per gene with variant-level results. In development, it is
likely preferable to use `--genes` argument with `write_results_files.py` to only write variant-level
results files for a few specific genes.

## Downloads files

Some generated files are intended to be available for download. These are written to a "downloads"
directory in the staging path set in `pipeline_config.ini`. This directory should be copied to a
public location and links on the browser downloads page updated accordingly.
