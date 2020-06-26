#!/bin/sh

set -eu

if [ $# -lt 1 ]; then
  echo "Usage: deploy-image.sh tag" 1>&2
  exit 1
fi

DEPLOY_TAG=$1

DEPLOYMENT_DIR=$(dirname "${0}")
cd "${DEPLOYMENT_DIR}"

IMAGE_NAME="gcr.io/exac-gnomad/exome-results-browsers"

# Push image to container registry
gcloud docker -- push "${IMAGE_NAME}:${DEPLOY_TAG}"

# Replace image name in manifest and update deployment
awk "{ sub(\"${IMAGE_NAME}\",\"${IMAGE_NAME}:${DEPLOY_TAG}\") }1" < ./manifests/deployment.yaml | kubectl apply -f -

# Wait for rollout to finish
kubectl rollout status "deployment/exome-results-browsers"
