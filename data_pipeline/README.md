# Data Pipeline

The data pipeline for the results browsers has 4 main steps.

- `prepare_gene_models` imports gene information from Gencode GTF files, canonical transcript
  lists, and HGNC data into Hail format. It also joins gnomAD and ExAC constraint data.

- `prepare_datasets` runs dataset-specific data pipelines for preparing gene-level and
  variant-level results. It also validates that the dataset-specific pipelines produce
  a Hail table with the schema required for the next step.

- `combine_datasets` combines gene models and results from multiple datasets into one Hail Table.

- `write_results_files` exports combined Hail table to JSON files to be served by API.

Configuration of the paths these steps write to is handled in `pipeline_config.ini`.

The output paths the steps above write to are combined by the `output.gcs_output_root` and `output.local_output_root` options in `pipeline_config.ini`. These two paths allow running of pipelines locally (for fast test datsets, and in dataproc (for the full datasets).

The date in the output path of independent pieces of data files (written by `prepare_gene_models`, `prepare_datasets`, and `prepare_downloads`) is controlled by the `<DATASET>.output_last_updated` option in `pipeline_config.ini`, e.g. `BipEx2.output_last_updated` controls the output path of the BipEx2 dataset hail tables, and downloads.

The output location of the combined hail table, created by `combine_datasets` is
controlled by the `output.output_last_updated` option in `pipeline_config.ini`.

e.g. local output files are written in to a path like: `./{local_output_root}/{output_last_updated}/<dataset_name>/...`

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

  - `gcs_output_root`, and `local_output_root` - when combined with `output_last_updated`, determine the path of the directory where pipelines should write Hail Tables

    After running data pipelines, this directory will a structure like:

    ```
    dataset1/
      YYYY-MM-DD_a/
        gene_results.ht
        variant_results.ht
      YYYY-MM-DD_b/
        gene_results.ht
        variant_results.ht
    dataset2/
      YYYY-MM-DD_c/
        gene_results.ht
        variant_results.ht
    ...
    ... same for other datasets
    ...
    gene_models/
      YYYY-MM-DD_d/
        gene_models.ht
    combined/
      YYYY-MM-DD_e
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

The pipelines accept arguments for which environment to run the pipeline in (dataproc, or local), and for which step to run

### Local

To run data pipelines locally, use the flags: `--environment local`, `--output-local`, and `--test-genes` to subset the input data for fast iteration on the real input data. The dataset files themselves are reponsible for determining which gene intervals to subset the input data to.

#### Prepare gene models

```bash
./data_pipeline/run_pipeline.py \
  --environment local \
  prepare_gene_models \
  --output-local
```

#### Prepare datasets

```bash
./data_pipeline/run_pipeline.py \
  --environment local \
  prepare_datasets --datasets <DATASET1> <DATASET2> \
  --output-local \
  --test-genes
```

e.g for GP2 + ClinVarGRCh38

```bash
./data_pipeline/run_pipeline.py \
  --environment local \
  prepare_datasets --datasets GP2 ClinVarGRCh38 \
  --output-local \
  --test-genes
```

#### Combine datasets

```bash
./data_pipeline/run_pipeline.py \
  --environment local \
  combine_datasets \
  --datasets <DATASET1> <DATASET2> \
  --output-local
```

e.g. for Epi25

```bash
./data_pipeline/run_pipeline.py \
  --environment local \
  combine_datasets \
  --datasets Epi25 \
  --output-local
```

#### Write results files

Once the `combined.ht` is generated, use `write_results_files.py` with subset arguments to write the static file locally to disk.

For production, **this step must be done on a VM**, as the data is too large to process locally, see [deployment/README.md](../deployment/README.md)

```bash
./data_pipeline/write_results_files.py \
  ./data/output-data/combined/<YYYY-MM-DD_DATE>/combined.ht \
  ./data/<OUTPUT_DIR_NAME> \
  --genes <ENSG_a> <ENSG_b> <ENSG_c>
```

Consider using a descriptive name for the results files directory, and sync'ing the ENSG ids to subset to, with teh gene intervals the individual data pipeline subsets its data to.

e.g. for BipEx2

```bash
./data_pipeline/write_results_files.py \
  ./data/output-data/combined/2026-06-24/combined.ht \
  ./data/2026-06-24_test-bipex2-pcsk9-akap11-shank1-fryl-magi2-cracdl \
  --genes ENSG00000169174 ENSG00000023516 ENSG00000161681 ENSG00000075539 ENSG00000187391 ENSG00000196872
```

See [CONTRIBUTING.md](../CONTRIBUTING.md#running-the-app-locally) for documentation on how to use these files for local development

### Dataproc

To run data pipelines on Dataproc, used when creating/updating demos, or updating production:

#### Start a dataproc cluster:

Configuration for the Dataproc cluster (GCP project, region, etc.) can be set in the `dataproc`
section of `pipeline_config.ini`.

```bash
./data_pipeline/start_dataproc_cluster.py
```

#### Prepare gene models

If any input to the gene models has updated, prepare the gene models. If you are unsure, you just run this step.

```bash
./data_pipeline/run_pipeline.py \
  --environment dataproc \
  prepare_gene_models
```

#### Prepare datasets.

If only one dataset has updated since the last production update, you can prepare just that data, e.g.

```bash
./data_pipeline/run_pipeline.py \
  --environment dataproc \
  prepare_datasets \
  --datasets BipEx2
```

If you are unsure, update all the datasets. All of the datasets are listed in the

```bash
./data_pipeline/run_pipeline.py \
  --environment dataproc \
  prepare_datasets \
  --datasets all
```

The datasets `all` argument uses the `datasets.datasets` option from `pipeline_config.ini`. The pipeline will output which datasets it is running for.

#### Combine datasets

For production, all the datasets should be combined, as the files that get written to a persistent disk based on this combined hail table will serve every dataset.

```bash
./data_pipeline/run_pipeline.py \
  --environment dataproc \
  combine_datasets \
  --datasets all
```

#### Prepare downloads

If only one dataset has been updated since the last production update, you can just update the downloads for that dataset, e.g.

```bash
./data_pipeline/run_pipeline.py \
    --environment dataproc \
    prepare_downloads \
    --datasets BipEx2
```

The downloads written out here include the date from the respective `<DATASET>.output_last_updated` option in `pipeline_config.ini`. If you update a download, you must update the date in the frontend downloads page, to point to the new file.

If you are unsure, you can prepare all the downloads files with the `--datasets all` option

#### Stop the dataproc cluster

```bash
./data_pipeline/stop_dataproc_cluster.py
```

#### Write results files

The combined Hail Table must be exported to JSON files which are served by the API. This is done
by the `write_results_files.py` script.

For production, a VM is used to do this. See [WRITE_RESULTS_FILES](./WRITE_RESULTS_FILES.md) for documentation on doing this

Once the files are written to a persistent disk, see [deployment/README.md](../deployment/README.md#deployments) for docs on how to use the disk in a demo/production update.
