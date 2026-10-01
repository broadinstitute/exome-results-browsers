#!/usr/bin/env bash
#
# Usage:
#   ./scripts/smoketest-pipeline.sh
#   ./scripts/smoketest-pipeline.sh --genes=ENSG00000169174,ENSG00000167207
#   ./scripts/smoketest-pipeline.sh --output-dir=data/smoke
#   ./scripts/smoketest-pipeline.sh --datasets GP2 --genes=ENSG00000169174
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d .venv ]; then
  echo "error: .venv does not exist. Run 'uv sync --group dev' (see CONTRIBUTING.md) first." >&2
  exit 1
fi

UV_RUN=(uv run --no-sync)
PIPELINE_CONFIG=data_pipeline/pipeline_config.ini

PCSK9_GENE_ID=ENSG00000169174
IBD_GENE_ID=ENSG00000167207
SMOKE_GENES=("$PCSK9_GENE_ID" "$IBD_GENE_ID")
SMOKE_DIR=data/smoke

DATASETS=(ASC BipEx BipEx2 Epi25 SCHEMA IBD GP2 ClinVarGRCh38)

while [ "$#" -gt 0 ]; do
  arg="$1"
  shift
  case "$arg" in
    --datasets)
      DATASETS=()
      while [ "$#" -gt 0 ] && [[ "$1" != --* ]]; do
        DATASETS+=("$1")
        shift
      done
      if [ "${#DATASETS[@]}" -eq 0 ]; then
        echo "error: --datasets requires at least one dataset" >&2
        exit 1
      fi
      ;;
    --genes=*)
      IFS=',' read -r -a SMOKE_GENES <<< "${arg#--genes=}"
      ;;
    --output-dir=*)
      SMOKE_DIR="${arg#--output-dir=}"
      ;;
    *)
      echo "error: unrecognized argument: $arg" >&2
      exit 1
      ;;
  esac
done

for dataset in "${DATASETS[@]}"; do
  case "$dataset" in
    ASC|ASC2|BipEx|BipEx2|Epi25|SCHEMA|IBD|GP2|ClinVarGRCh38) ;;
    *)
      echo "error: unknown dataset: $dataset" >&2
      exit 1
      ;;
  esac
done

echo "==> prepare_gene_models"
"${UV_RUN[@]}" ./data_pipeline/run_pipeline.py --environment local prepare_gene_models --output-local

printf '==> prepare_datasets: %s\n' "${DATASETS[*]}"
"${UV_RUN[@]}" ./data_pipeline/run_pipeline.py --environment local prepare_datasets \
  --datasets "${DATASETS[@]}" --output-local --test-genes

printf '==> combine_datasets: %s\n' "${DATASETS[*]}"
"${UV_RUN[@]}" ./data_pipeline/run_pipeline.py --environment local combine_datasets \
  --datasets "${DATASETS[@]}" --output-local

combined_date=$("${UV_RUN[@]}" python3 -c "
import configparser
config = configparser.ConfigParser()
config.read('$PIPELINE_CONFIG')
print(config.get('output', 'output_last_updated'))
")
combined_ht="data/output-data/combined/${combined_date}/combined.ht"

if [ ! -d "$combined_ht" ]; then
  echo "error: expected combine_datasets to write $combined_ht, but it does not exist" >&2
  exit 1
fi

cleanup_partial_smoke_dir() {
  local exit_code=$?
  if [ "$exit_code" -ne 0 ]; then
    echo "==> write_results_files interrupted; removing partial $SMOKE_DIR" >&2
    rm -rf "$SMOKE_DIR"
  fi
}
trap cleanup_partial_smoke_dir EXIT

echo "==> write_results_files -> $SMOKE_DIR"
rm -rf "$SMOKE_DIR"
"${UV_RUN[@]}" ./data_pipeline/write_results_files.py "$combined_ht" "$SMOKE_DIR" --genes "${SMOKE_GENES[@]}"

trap - EXIT

echo "Wrote smoke test data to $SMOKE_DIR"
