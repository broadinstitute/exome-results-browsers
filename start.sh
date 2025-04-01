#!/bin/sh

set -eu

# Explicitly declare what env vars we want to pull in
#   we don't include GA Tracking IDs as that would add false traffic
development_environment_variables=("DEMO_PASSWORD")

if [ -f "build.env" ]; then
  while IFS= read -r line; do
    if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then
      continue
    fi

    var_name=$(echo "$line" | cut -d'=' -f1)

    is_allowed=false
    for allowed_var in "${development_environment_variables[@]}"; do
      if [ "$var_name" = "$allowed_var" ]; then
        is_allowed=true
        break
      fi
    done

    if "$is_allowed"; then
      export "$line"
    fi
  done < "build.env"
fi

print_usage() {
  echo "Usage: start.sh BROWSER [--proxy-api] [--port PORT]" 1>&2
}

while [ $# -ne 0 ]; do
  arg="$1"
  case "$arg" in
    --proxy-api)
      USE_REMOTE_API=true
      ;;
    --port)
      if [ -z "${2:-}" ] || ! echo "$2" | grep -Eq '^[0-9]+$'; then
        print_usage
        exit 1
      else
        WDS_PORT=$2
        shift
      fi
      ;;
    *)
      if [ -n "${BROWSER:-}" ]; then
        print_usage
        exit 1
      else
        BROWSER=$1
      fi
      ;;
  esac
  shift
done

export BROWSER
export USE_REMOTE_API=${USE_REMOTE_API:-false}
WDS_PORT=${WDS_PORT:-8000}
export PORT=$((WDS_PORT + 10))

if [ -z "${BROWSER:-}" ]; then
  print_usage
  exit 1
fi

PROJECT_DIR=$(dirname "$0")
cd "$PROJECT_DIR"

# Validate browser argument
BROWSER_DIRECTORY=$(echo "$BROWSER" | tr '[:upper:]' '[:lower:]')
if [ ! -f "./src/browsers/${BROWSER_DIRECTORY}/${BROWSER}Browser.js" ]; then
  echo "did not find ${BROWSER}Browser.js in src/browsers/${BROWSER_DIRECTORY}" 1>&2
  exit 1
fi

export NODE_ENV="development"

if [ "${USE_REMOTE_API:-false}" = "true" ]; then
  yarn run webpack-dev-server --config=./src/browsers/webpack.config.js --hot --port "$WDS_PORT"
else
  yarn run nodemon src/server/server.js &
  SERVER_PID=$!

  yarn run webpack-dev-server --config=./src/browsers/webpack.config.js --hot --port "$WDS_PORT" &
  WDS_PID=$!

  trap "kill $SERVER_PID $WDS_PID; exit 1" INT

  wait
fi
