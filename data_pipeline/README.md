# Data Pipeline

The data pipeline for the results browsers has 4 main steps.

- `prepare_gene_models` imports gene information from Gencode GTF files, canonical transcript
  lists, and HGNC data into Hail format. It also joins gnomAD and ExAC constraint data.

- `prepare_dataset` runs a dataset-specific data pipeline for preparing gene-level and
  variant-level results. This must be run on each dataset individually. This also validates
  that the dataset-specific pipelines produce a Hail table with the schema required for the
  next step.

- `combine_datasets` combines gene models and results from multiple datasets into one Hail Table.

- `write_results_files` exports combined Hail table to JSON files to be served by API.

The output location of `prepare_gene_models`, `prepare_datasets`, and `combine_datasets` is
controlled by the `output.staging_path` option in `pipeline_config.ini`.

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
./data_pipeline/run_pipeline.py --environment dataproc piepline_name pipeline_args
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
  for DATASET in ASC BipEx Epi25 SCHEMA; do
     ./data_pipeline/run_pipeline.py --environment dataproc prepare_dataset $DATASET
  done
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
