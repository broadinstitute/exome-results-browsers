#!/usr/bin/env bash
#
# Usage:
#   ./scripts/smoke.sh
#   ./scripts/smoke.sh --clean-install     # clear and re-sync dependencies
#   ./scripts/smoke.sh --project=SCHEMA    # only playwright test a certain dataset
set -euo pipefail

cd "$(dirname "$0")/.."

clean_install=false
args=()
for arg in "$@"; do
  case "$arg" in
    --clean-install) clean_install=true ;;
    *) args+=("$arg") ;;
  esac
done

if [ "$clean_install" = true ]; then
  echo "==> Clean install: node_modules"
  rm -rf node_modules
  yarn install --frozen-lockfile --non-interactive --no-progress

  echo "==> Clean install: .venv"
  rm -rf .venv
  uv sync --locked --group dev
  echo "Re-run .llm_nb/install-gcs-connector.py now if the pipeline fails to read gs:// paths."
fi

./scripts/smoke-pipeline.sh

echo "==> Building browsers"
yarn run build

if [ "${#args[@]}" -eq 0 ]; then
  yarn run smoketest:frontend
else
  yarn run smoketest:frontend "${args[@]}"
fi
