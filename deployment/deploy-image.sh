#!/bin/sh

set -eu

if [ $# -lt 1 ]; then
  echo "Usage: deploy-image.sh tag" 1>&2
  exit 1
fi

DEPLOY_TAG=$1

DEPLOYMENT_DIR=$(dirname "${0}")
cd "${DEPLOYMENT_DIR}"

IMAGE_NAME="us-docker.pkg.dev/exac-gnomad/gnomad/exome-results-browsers"

# Push image to container registry
podman push "${IMAGE_NAME}:${DEPLOY_TAG}"
