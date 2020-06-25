#!/bin/sh

set -eu

if [ $# -lt 1 ]; then
  echo "Usage: start.sh browser [port]" 1>&2
  exit 1
fi

BROWSER=$1

PROJECT_DIR=$(dirname "$0")
cd "$PROJECT_DIR"

# Validate browser argument
BROWSER_DIRECTORY=$(echo "$BROWSER" | tr '[:upper:]' '[:lower:]')
if [ ! -f "./src/browsers/${BROWSER_DIRECTORY}/${BROWSER}Browser.js" ]; then
  echo "did not find ${BROWSER}Browser.js in src/browsers/${BROWSER_DIRECTORY}" 1>&2
  exit 1
fi

export NODE_ENV="development"
export BROWSER=$BROWSER

DEFAULT_WDS_PORT=8000
WDS_PORT=${2:-$DEFAULT_WDS_PORT}
export PORT=$((WDS_PORT + 10))

yarn run nodemon src/server/server.js &
SERVER_PID=$!

yarn run webpack-dev-server --config=./src/browsers/webpack.config.js --hot --port "$WDS_PORT" &
WDS_PID=$!

trap "kill $SERVER_PID $WDS_PID; exit 1" INT

wait
