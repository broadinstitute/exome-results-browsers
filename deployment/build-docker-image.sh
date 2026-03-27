#!/bin/sh

set -eu

IMAGE_REPO="us-docker.pkg.dev/exac-gnomad/gnomad/exome-results-browsers"
GIT_HASH=$(git rev-parse --short HEAD)

NO_CACHE=""
CUSTOM_TAG=""
PUSH_IMAGE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --tag)
            CUSTOM_TAG="$2"
            shift 2
            ;;
        --push)
            PUSH_IMAGE=true
            shift
            ;;
        *)
            echo "Unknown parameter passed: $1"
            echo "Usage: $0 [--no-cache] [--tag <name>] [--push]"
            exit 1
            ;;
    esac
done

if [[ -n "$CUSTOM_TAG" ]]; then
    FINAL_TAG="${GIT_HASH}-${CUSTOM_TAG}"
else
    FINAL_TAG="${GIT_HASH}"
    BRANCH=$(git symbolic-ref --short -q HEAD)
    if [ "$BRANCH" != "main" ]; then
      TAG_BRANCH=$(echo "$BRANCH" | sed 's/[^A-Za-z0-9_\-\.]/_/g')
      FINAL_TAG="${FINAL_TAG}-${TAG_BRANCH}"
    fi


    GIT_STATUS=$(git status --porcelain 2> /dev/null | tail -n1)
    if [ -n "$GIT_STATUS" ]; then
      FINAL_TAG="${FINAL_TAG}-modified"
    fi
fi

FULL_IMAGE_NAME="${IMAGE_REPO}:${FINAL_TAG}"

# ---

DEPLOYMENT_DIR=$(dirname "$0")
cd "${DEPLOYMENT_DIR}/.."

if [ ! -f build.env ]; then
  echo "'build.env' not found. Create it to build image." 1>&2
  exit 1
fi

docker build . \
  --tag "${FULL_IMAGE_NAME}" \
  --tag "${IMAGE_REPO}:latest"

echo "Successfully built image: '${FULL_IMAGE_NAME}'"

if [ "$PUSH_IMAGE" = true ]; then
    echo "Pushing Docker image to Artifact Registry..."
    docker push "${FULL_IMAGE_NAME}"
    echo "Successfully pushed ${FULL_IMAGE_NAME}"
else
    echo "Build complete. Skipping push since --push was not provided."
fi
