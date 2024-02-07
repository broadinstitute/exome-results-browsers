#!/bin/sh

set -eu

DEPLOYMENT_DIR=$(dirname "$0")
cd "${DEPLOYMENT_DIR}/.."

if [ ! -f build.env ]; then
  echo "'build.env' not found. Create it to build image." 1>&2
  exit 1
fi

PUSH_IMAGE=false

if [ "$1" = "push" ]; then
  PUSH_IMAGE=true
fi

# Tag image with git revision
COMMIT_HASH=$(git rev-parse --short HEAD)
IMAGE_TAG=${COMMIT_HASH}

# Add current branch name to tag if not on main branch
BRANCH=$(git symbolic-ref --short -q HEAD)
if [ "$BRANCH" != "main" ]; then
  TAG_BRANCH=$(echo "$BRANCH" | sed 's/[^A-Za-z0-9_\-\.]/_/g')
  IMAGE_TAG="${IMAGE_TAG}-${TAG_BRANCH}"
fi

# Add "-modified" to tag if there are uncommitted local changes
GIT_STATUS=$(git status --porcelain 2> /dev/null | tail -n1)
if [ -n "$GIT_STATUS" ]; then
  IMAGE_TAG="${IMAGE_TAG}-modified"
fi

docker build . \
  --tag "gcr.io/exac-gnomad/exome-results-browsers:${IMAGE_TAG}" \
  --tag "gcr.io/exac-gnomad/exome-results-browsers:latest"

echo "gcr.io/exac-gnomad/exome-results-browsers:${IMAGE_TAG}"

# Push image to the container registry if 'push' was passed
if [ "$PUSH_IMAGE" = true ]; then
  docker push "gcr.io/exac-gnomad/exome-results-browsers:${IMAGE_TAG}"
  docker push "gcr.io/exac-gnomad/exome-results-browsers:latest"
  echo "Pushed gcr.io/exac-gnomad/exome-results-browsers:${IMAGE_TAG}"
fi
