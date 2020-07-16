# Contributing

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

## Data pipeline

See [data_pipeline/README.md](./data_pipeline/README.md) for instructions on running the
data pipeline.

## Development

In production, the dataset/browser is determined by the request hostname. In development, the
application is served on localhost and the dataset/browser is determined by the `BROWSER`
environment variable. The first argument to `start.sh` sets that variable.

To start a development server, run:

```
RESULTS_DATA_DIRECTORY=/path/to/results/data ./start.sh $BROWSER_NAME
```

For example:

```
RESULTS_DATA_DIRECTORY=/path/to/results/data ./start.sh SCHEMA
```

This runs the server with nodemon and frontend with webpack-dev-server, so that each is
rebuilt/reloaded when a source file is changed. `RESULTS_DATA_DIRECTORY` should be the path
to a directory where the data pipeline results files were written.

For frontend development, instead of running a server locally, API requests can be proxied
to the production environment.

```
./start.sh $BROWSER_NAME --proxy-api
```

### Docker

The Docker build copies a `build.env` file and reads environment variables from it. Currently,
the only values in `build.env` are Google Analytics tracking IDs for the production deployment.
Thus, an empty file will work for development.

```
touch build.env
```

Build the Docker image.

```
docker build -t exome-results-browsers .
```

Run the Docker image. A directory containing results files output from the data pipeline must
be attached as a volume and the `RESULTS_DATA_DIRECTORY` environment variable set to that
volume's mount point.

```
docker run --rm -ti --init \
   -v /path/to/results/data:/var/lib/results \
   -e RESULTS_DATA_DIRECTORY=/var/lib/results \
   -p 8000:8000 \
   exome-results-browsers
```

The Docker image is configured to run the application in production mode, where the current
dataset/browser is determined by the subdomain of the requested URL. One way to make this
work locally is adding hostnames to `/etc/hosts`:

```
127.0.0.1 asc.dev.localhost
127.0.0.1 bipex.dev.localhost
127.0.0.1 epi25.dev.localhost
127.0.0.1 schema.dev.localhost
```

With those lines added to `/etc/hosts`, the browsers can be accessed at
`http://asc.dev.localhost:8000`, `http://bipex.dev.localhost:8000`, etc.

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

  - Add dataset name to the `datasets.datasets` configuration in `data_pipeline/pipeline_config.ini`.

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

- variantCustomFilter (object) - Definition for browser specific variant filter controls.

  - component (Component) - React component to render filter controls.

  - defaultFilter (any) - Default filter settings.

  - applyFilter (function) - Function to filter list of variants based on current filter settings.

- renderVariantAttributes (function) - Function to render `info` field of a variant.
