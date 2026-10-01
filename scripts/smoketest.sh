#!/usr/bin/env bash
#
# Usage:
#   ./scripts/smoketest.sh
#   ./scripts/smoketest.sh --clean-install                        # clear and re-sync dependencies
#   ./scripts/smoketest.sh --genes=ENSG00000169174,ENSG00000167207 # only write results for these genes
#   ./scripts/smoketest.sh --output-dir=data/smoke                 # write smoke test data elsewhere
#   ./scripts/smoketest.sh --datasets GP2 --project=GP2
#   ./scripts/smoketest.sh --project=SCHEMA                        # only playwright test a certain dataset
set -euo pipefail

cd "$(dirname "$0")/.."

clean_install=false
pipeline_args=()
args=()
while [ "$#" -gt 0 ]; do
  arg="$1"
  shift
  case "$arg" in
    --datasets)
      pipeline_args+=("$arg")
      while [ "$#" -gt 0 ] && [[ "$1" != --* ]]; do
        pipeline_args+=("$1")
        shift
      done
      ;;
    --clean-install) clean_install=true ;;
    --genes=*|--output-dir=*) pipeline_args+=("$arg") ;;
    *) args+=("$arg") ;;
  esac
done

if [ "$clean_install" = true ]; then
  cleanup_partial_install() {
    local exit_code=$?
    if [ "$exit_code" -ne 0 ]; then
      echo "==> Clean install interrupted; removing partial node_modules/.venv" >&2
      rm -rf node_modules .venv
    fi
  }
  trap cleanup_partial_install EXIT

  echo "==> Clean install: node_modules"
  rm -rf node_modules
  yarn install --frozen-lockfile --non-interactive --no-progress

  echo "==> Clean install: .venv"
  rm -rf .venv
  uv sync --locked --group dev
  echo "Re-run .llm_nb/install-gcs-connector.py now if the pipeline fails to read gs:// paths."

  trap - EXIT
fi

if [ "${#pipeline_args[@]}" -eq 0 ]; then
  ./scripts/smoketest-pipeline.sh
else
  ./scripts/smoketest-pipeline.sh "${pipeline_args[@]}"
fi

echo "==> Building browsers"
yarn run build

if [ "${#args[@]}" -eq 0 ]; then
  yarn run smoketest:frontend
else
  yarn run smoketest:frontend "${args[@]}"
fi
