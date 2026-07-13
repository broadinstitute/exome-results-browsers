# Contributing

## Setting up a development environment

- Install [Node.js](https://nodejs.org/), [Yarn (v1)](https://classic.yarnpkg.com/), and [Python](https://www.python.org).

  - Confirm your using the versions specified in the `.tool_versions` file. For convenience, consider using a tool such as `asdf` or `mise` to manage this

- Install javascript dependencies.

  ```bash
  yarn
  ```

- Install [pre-commit](https://pre-commit.com/) and configure hooks.

  ```bash
  pre-commit install
  ```

- Install [uv](https://docs.astral.sh/uv/getting-started/installation/).

- Install python dependencies and development tools.

  ```bash
  cd data_pipeline
  uv sync --group dev
  ```

  This creates a `.venv` inside `data_pipeline/` with all dependencies. To activate it:

  ```bash
  source data_pipeline/.venv/bin/activate
  ```

  Alternatively, prefix pipeline commands with `uv run` instead of activating the venv.

## Organization

The exome results browsers are structured as a single application that serves a different dataset
and browser interface based on the request hostname.

- data_pipeline
  - data_pipeline
    - datasets - Browser specific data pipelines
    - pipelines - Shared data pipelines
    - pipeline_config.ini - Data URLs
- src
  - browsers - Frontend code
    - base - Shared browser code
    - geneResultComponents.js - Browser specific components for gene-level results
  - server - API code


## Development

### Data

See [data_pipeline/README.md](./data_pipeline/README.md) for instructions on running the
data pipeline locally, and for production.

Use these files produced by the pipeline to serve data from a local backend, to a local frontend, as described below

### Running the app locally

In production, the dataset/browser is determined by the request hostname. In development, the
application is served on localhost and the dataset/browser is determined by the `BROWSER`
environment variable. The first argument to `start.sh` sets that variable.

To start a development server, run:

```
RESULTS_DATA_DIRECTORY=/path/to/results/data ./start.sh $BROWSER_NAME
```

For example:

```
RESULTS_DATA_DIRECTORY=data/2026-06-17_test-gp2-pcsk9-gba1-il17ra ./start.sh GP2
```

This runs the server with nodemon and frontend with webpack-dev-server, so that each is
rebuilt/reloaded when a source file is changed. `RESULTS_DATA_DIRECTORY` should be the path
to a directory where the data pipeline results files were written.

For frontend only development, instead of running a server locally, API requests can be proxied
to the production environment.

```
./start.sh $BROWSER_NAME --proxy-api
```

## Adding a new browser

- Create a data preparation pipeline for the dataset.

  - Create a file `data_pipeline/data_pipeline/datasets/<dataset>/<dataset>_gene_results.py`,
    where `<dataset>` is the lowercase dataset/browser name.

    This file should define a function `prepare_gene_results` that returns a Hail Table
    with the following fields:

    ```
    'gene_id': str
    'group_results': dict<str, struct{ ... }>
    ```

    The table should be keyed by `gene_id`.

    `gene_id` should contain the Ensembl ID for the gene.

    `group_results` keys should be names of analysis groups and values the gene-level results
    for those groups. The result struct may contain string, number, or boolean fields.

    The `prepare_datasets` pipeline validates the schema of the Hail Table returned by this function.

  - Create a file `data_pipeline/data_pipeline/datasets/<dataset>/<dataset>_variant_results.py`,
    where `<dataset>` is the lowercase dataset/browser name.

    This file should define a function `prepare_variant_results` that returns a Hail Table
    with the following fields:

    ```
    'locus': locus
    'alleles': array<str>
    'gene_id': str
    'consequence': str
    'hgvsc': str
    'hgvsp': str
    'group_results': dict<str, struct{ ... }>
    'info': struct{ ... }
    ```

    The table should be keyed by `locus` and `alleles`.

    `consequence` should contain the variant's consequence in the analysis. This can be an
    arbitrary value.

    `gene_id` should contain the Ensembl ID for the gene in which the variant appears.

    `hgvsc` should contain the variant's HGVSc consequence in the gene's canonical transcript.

    `hgvsp` should contain the variant's HGVSp consequence in the gene's canonical transcript.

    `group_results` keys should be names of analysis groups and values the variant-level results
    for those groups. The result struct may contain string, number, or boolean fields.

    `info` may contain additional variant level data (string, number, or boolean fields).

    The `prepare_datasets` pipeline validates the schema of the Hail Table returned by this function.

  - Add dataset name to the `datasets.datasets` configuration in `data_pipeline/data_pipeline/pipeline_config.ini`.

- Create the browser frontend.

  - Create a file `src/browsers/<dataset>/<dataset>Browser.js` (the directory name must be lowercase).

    This file should export a component to render the browser for the dataset. This will likely
    render a configured `Browser` component from `src/browsers/base/Browser.js`.

  - Create a file `src/browsers/<dataset>/<dataset>GeneResults.js`.

    This file should export a component to render the gene-level result for the dataset. The
    component should take a `results` prop, which is an object whose keys are analysis group names
    and values the gene-level result for that analysis group.

    Add this component to `src/browsers/geneResultComponents.js`.

  - Add the dataset name to list of browsers in `src/browsers/webpack.config.js`.

## Browser configuration

- browserTitle (string) - Title displayed in navigation bar.

- navBarBackgroundColor (string) - Background color of navigation bar.

- homePage (Component) - React component for home page content.

- extraPages (array of objects) - Additional browser pages.

  - path (string) - URL path for page.

  - label (string) - Label for page in navigation bar.

  - component (Component) - React component for page content.

### Gene results configuration

- geneResultsPageHeading (string) - Heading for all gene results page.

- geneResultAnalysisGroupOptions (array of strings) - Groups to include in analysis group menu on all gene results page.

- defaultGeneResultAnalysisGroup (string) - Analysis group to show by default on all gene results page.

- defaultGeneResultSortKey (string) - Default field to sort gene results table by.

- geneResultColumns (array of objects) - Column definitions for gene results table.

  - key (string) - Unique identifier for field.

  - heading (string) - Column label.

  - minWidth (number) - Minimum width (in pixels) for column.

  - tooltip (string) - Tooltip text for column heading.

  - render (function) - Function to render cell content.

  - renderForCSV (function) - Function to render cell content in CSV export.

- geneResultTabs (array of objects) - Define additional tabs for content on all gene results page.

  - id (string) - Tab ID.

  - label (string) - Tab label.

  - render (function) - Function to render tab content.

### Variant results configuration

- variantAnalysisGroupOptions (array of strings) - Groups to include in analysis group menu for variants table on gene page.

- defaultVariantAnalysisGroup (string) - Analysis group to show by default in variants table.

- variantResultColumns (array of objects) - Column definitions for variants table.

  - key (string) - Unique identifier for field.

  - heading (string) - Column label.

  - minWidth (number) - Minimum width (in pixels) for column.

  - tooltip (string) - Tooltip text for column heading.

  - render (function) - Function to render cell content.

  - renderForCSV (function) - Function to render cell content in CSV export.

  - showOnGenePage (boolean) - Include this column in variants table on gene page.

  - showOnDetails (boolean) - Include this column in table in variant details popup.

- variantConsequences (array of objects) - List of variant consequences used in analysis.

  - term (string) - Consequence term in variant results.

  - category (one of lof, missense, synonymous, other) - Consequence category

- variantConsequenceCategoryLabels (object) - Labels for consequence categories in variant filter controls.

- variantCustomFilter (object) - Definition for browser specific variant filter controls.

  - component (Component) - React component to render filter controls.

  - defaultFilter (any) - Default filter settings.

  - applyFilter (function) - Function to filter list of variants based on current filter settings.

- renderVariantAttributes (function) - Function to render `info` field of a variant.

## Deployment to Production

See [deployment/README.md](./deployment/README.md)
