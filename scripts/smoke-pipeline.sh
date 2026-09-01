#!/usr/bin/env bash
#
# Usage:
#   ./scripts/smoke-pipeline.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d .venv ]; then
  echo "error: .venv does not exist. Run 'uv sync --group dev' (see CONTRIBUTING.md) first." >&2
  exit 1
fi

UV_RUN=(uv run --no-sync)

PCSK9_GENE_ID=ENSG00000169174
IBD_GENE_ID=ENSG00000167207
SMOKE_GENES=("$PCSK9_GENE_ID" "$IBD_GENE_ID")
DATASETS=(ASC BipEx BipEx2 Epi25 SCHEMA IBD GP2 ClinVarGRCh38)
SMOKE_DIR=data/smoke

echo "==> prepare_gene_models"
"${UV_RUN[@]}" ./data_pipeline/run_pipeline.py --environment local prepare_gene_models --output-local

echo "==> prepare_datasets (${DATASETS[*]})"
"${UV_RUN[@]}" ./data_pipeline/run_pipeline.py --environment local prepare_datasets \
  --datasets "${DATASETS[@]}" --output-local --test-genes

echo "==> combine_datasets (${DATASETS[*]})"
"${UV_RUN[@]}" ./data_pipeline/run_pipeline.py --environment local combine_datasets \
  --datasets "${DATASETS[@]}" --output-local

combined_date=$("${UV_RUN[@]}" python3 -c "
import configparser
config = configparser.ConfigParser()
config.read('data_pipeline/pipeline_config.ini')
print(config.get('output', 'output_last_updated'))
")
combined_ht="data/output-data/combined/${combined_date}/combined.ht"

if [ ! -d "$combined_ht" ]; then
  echo "error: expected combine_datasets to write $combined_ht, but it does not exist" >&2
  exit 1
fi

echo "==> write_results_files -> $SMOKE_DIR"
rm -rf "$SMOKE_DIR"
"${UV_RUN[@]}" ./data_pipeline/write_results_files.py "$combined_ht" "$SMOKE_DIR" --genes "${SMOKE_GENES[@]}"

echo "Wrote smoke test data to $SMOKE_DIR"
