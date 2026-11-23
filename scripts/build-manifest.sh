#!/usr/bin/env bash
#
# Usage: ./scripts/build-manifest.sh > manifest.txt
#
# Prints every file in the build output with its size, content hashes stripped from names,
# so builds from two toolchains can be compared with diff.
set -euo pipefail

cd "$(dirname "$0")/../src/server/public"

find . -type f -printf '%s %p\n' |
  sed -E 's/-[0-9a-f]{20}\./-HASH./; s/\/[0-9a-f]{32}\./\/HASH./' |
  awk '{ print $2, $1 }' |
  sort
