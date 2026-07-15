# Deployment

## Data preparation

See [data_pipeline/README.md](../data_pipeline/README.md) for instructions on running the data pipeline.

## Writing results files to a persistent disk

See [data_pipeline/WRITE_RESULTS_FILES.md](../data_pipeline/WRITE_RESULTS_FILES.md) for using the `combined.ht` produced by the data pipeline to write results files to a persistent disk in GCS.

## Frontend/Backend Docker image

The Docker build copies a `build.env` file and reads environment variables from it. Create the `build.env`
file and fill in values for variables.

```
cat <<EOF > build.env
DEMO_PASSWORD=
EOF
```

Note that the `DEMO_PASSWORD` should be a string with no `""`s, if quotes are included, the password will include the quotes. e.g. `DEMO_PASSWORD="password"` would require a user to type `"password"` into the box, as opposed to just `password`.

GA tracking IDs are hardcoded in `src/browsers/webpack.config.js` and do not need to be set in `build.env`.

**Build the Docker image. The build script tags the image with the current git revision.**

Build the docker image with a default tag of the git revision

```
./deployment/build-docker-image.sh
```

Use the flags for convenience to give the image a custom tag, and push it to the artifact registry

```
./deployment/build-docker-image.sh --no-cache --tag <TAG_NAME> --push
```

e.g.

```
./deployment/build-docker-image.sh --no-cache --tag prod-2026-03-27--11-22 --push
```

## Deployments

The [gnomad-deployments](https://github.com/broadinstitute/gnomad-deployments) repository contains a base kubernetes deployment, and additional kustomizations on top of that.

To manage deployments, run the following commands from the `gnomad-deployments` repository. You must be VPN'd into the broad to apply changes.

Deployments are primarily updated by updating the docker image for any change in the app running in deployment, or by updating the persistent disk to update the data that serves the deployent.

### Updating/Creating a demo deployment

Demo deployments for exome results browsers are workload on the `exac-gnomad` kubernetes cluster that gnomAD exists on. Creating new demo deployments, or updating existing ones is done by creating or updating kustomization files with new resources, and applying the updates.

If creating a new demo, create a new directory in the `exome-results-browsers` dir. Use the existing `demo` directory as a template. Since production manages API responses by dataset using subdomains, demos currently require manually setting this dataset in the API, and creating a seperate demo deployment per running demo.

See: https://github.com/broadinstitute/exome-results-browsers/pull/155 for sample app changes
See: https://github.com/broadinstitute/gnomad-deployments/pull/32 for the corresponding deployment PR

In this new demo directory, or in an existing one, update the docker image to include new app changes, and persistent disk for data changes, in the `kustomization.yaml` file, as needed. See [this commit](https://github.com/broadinstitute/gnomad-deployments/pull/32/changes/205cd6da7820fb22169cd72636298f64ea6ae5cd) for a recent example.

Apply the changes with

```bash
kubectl apply -k exome-results-browsers/<DEMO_DIR>
```

e.g.

```bash
kubectl apply -k exome-results-browsers/bipex2-demo
```

### Updating the production deployment

The production exome results browser deployment is a workload on the `exac-gnomad` kubernetes cluster that gnomAD exists on. Updating production is done by updating kustomization files with new resources, and applying the updates.

Updates to production happen manually via an updating of the `base` dir's `deployment.yaml`'s persistent disk and the `prod` dirs `kustomization.yaml`. See [this commit](https://github.com/broadinstitute/gnomad-deployments/pull/34/changes/a45c32c51b847f934da979e3651dcec8de08a305) for a recent example of updating production's docker image, and persistent disk.

Apply the changes with

```bash
kubectl apply -k exome-results-browsers/prod
```

## GKE resources

- If you don't already have one, create a GKE cluster, e.g. https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-zonal-cluster. Our environments are managed in [terraform](https://github.com/broadinstitute/gnomad-terraform).

- If exposing your deployment to the internet, reserve IP address. This is preferably done via terraform in [gnomad-terraform](https://github.com/broadinstitute/gnomad-terraform), but for reference, a global IP address could be reserved with:

  ```
  gcloud compute addresses create exome-results-browsers --global
  ```
