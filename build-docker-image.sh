#!/bin/bash

set -eu

if [ $# -lt 2 ]; then
  echo "Usage: build-docker-image.sh browser image_name" 1>&2
  exit 1
fi

BROWSER=$1
IMAGE_NAME=$2

PROJECT_DIR=$(dirname "${BASH_SOURCE}")
cd $PROJECT_DIR

# Validate browser argument
if [[ ! -d ./browsers/${BROWSER} ]]; then
  echo "configuration for ${BROWSER} does not exist" 1>&2
  exit 1
fi

# Tag image with git revision
COMMIT_HASH=$(git rev-parse --short HEAD)
IMAGE_TAG=${COMMIT_HASH}

# Add current branch name to tag if not on master branch
BRANCH=$(git symbolic-ref --short -q HEAD)
if [[ "$BRANCH" != "master" ]]; then
  TAG_BRANCH=$(echo "$BRANCH" | sed 's/[^A-Za-z0-9_\-\.]/_/g')
  IMAGE_TAG="${IMAGE_TAG}-${TAG_BRANCH}"
fi

# Add "-modified" to tag if there are uncommitted local changes
GIT_STATUS=$(git status --porcelain 2> /dev/null | tail -n1)
if [[ -n $GIT_STATUS ]]; then
  IMAGE_TAG="${IMAGE_TAG}-modified"
fi

docker build --build-arg BROWSER=${BROWSER} --tag ${IMAGE_NAME}:${IMAGE_TAG} --tag ${IMAGE_NAME}:latest .

echo ${IMAGE_NAME}:${IMAGE_TAG}
