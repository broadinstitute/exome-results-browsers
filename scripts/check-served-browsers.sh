#!/usr/bin/env bash
#
# Usage: ./scripts/check-served-browsers.sh [BASE_URL]
#
# Checks a production-mode server (NODE_ENV=production): for every browser in
# src/browsers/browsers.js, the subdomain serves an index.html whose bundle loads.
set -euo pipefail

cd "$(dirname "$0")/.."

base_url="${1:-http://localhost:8000}"
minimum_bundle_bytes=100000

for attempt in $(seq 1 60); do
  if [ "$(curl -fsS "$base_url/ready" 2>/dev/null)" = "true" ]; then
    break
  fi
  if [ "$attempt" -eq 60 ]; then
    echo "error: $base_url/ready did not return true within 60s" >&2
    exit 1
  fi
  sleep 1
done

failures=0
for browser in $(node -p "require('./src/browsers/browsers').join(' ')"); do
  host="$(echo "$browser" | tr '[:upper:]' '[:lower:]').browser.test"

  if ! index_html=$(curl -fsS -H "Host: $host" "$base_url/"); then
    echo "FAIL $browser: GET / failed" >&2
    failures=$((failures + 1))
    continue
  fi

  bundle_path=$(echo "$index_html" | grep -o 'src="/bundle[^"]*\.js"' | head -1 | sed 's/^src="//; s/"$//')
  if [ -z "$bundle_path" ]; then
    echo "FAIL $browser: index.html has no bundle script tag" >&2
    failures=$((failures + 1))
    continue
  fi

  bundle_bytes=$(curl -fsS -H "Host: $host" -o /dev/null -w '%{size_download}' "$base_url$bundle_path" || echo 0)
  if [ "$bundle_bytes" -lt "$minimum_bundle_bytes" ]; then
    echo "FAIL $browser: $bundle_path is $bundle_bytes bytes" >&2
    failures=$((failures + 1))
    continue
  fi

  echo "ok   $browser: $bundle_path ($bundle_bytes bytes)"
done

if [ "$failures" -gt 0 ]; then
  echo "$failures browser(s) failed" >&2
  exit 1
fi
