# Deployment

## Data preparation

See [data_pipeline/README.md](../data_pipeline/README.md) for instructions on running the data pipeline.

## Results files

For the production deployment, results files created by the last step of the data pipeline must be stored
on a Persistent Disk.

A persistent disk can only be [attached to multiple instances](https://cloud.google.com/compute/docs/disks/add-persistent-disk#use_multi_instances)
if it is attached to all those instances in read-only mode. Thus, updating browser data without downtime
requires creating a new disk since any existing disk with current data is attached to the GKE node serving
the browsers and so cannot be attached to another instance in read-write mode.

```
./deployment/prepare-disk.sh gs://bucket/path/to/combined.ht
```

This script creates a temporary instance, attaches a disk to it, formats the disk, downloads the combined
results Hail Table and uses it to create JSON files for the API server. Results files will be written to
a `results` directory at the root of the disk.

To use the new disk in a deployed instance of the browsers, modify the `pdName` value in the volumes section
of deployment/manifests/deployment.yaml and run `kubectl apply -f deployment/manifests/deployment.yaml`.

## Docker image

The Docker build copies a `build.env` file and reads environment variables from it. Create the `build.env`
file and fill in values for variables.

```
cat <<EOF > build.env
ASC_BROWSER_GA_TRACKING_ID=
BipEx_BROWSER_GA_TRACKING_ID=
Epi25_BROWSER_GA_TRACKING_ID=
SCHEMA_BROWSER_GA_TRACKING_ID=
EOF
```

Build the Docker image. The build script tags the image with the current git revision.

```
./deployment/build-docker-image.sh
```

## GKE resources

- Build Docker image and [push it to Container Registry](https://cloud.google.com/container-registry/docs/pushing-and-pulling).

- Create deployment.

  ```
  kubectl apply -f manifests/deployment.yaml
  ```

- Reserve IP address.

  ```
  gcloud compute addresses create exome-results-browsers --global
  ```

- Expose deployment with an [Ingress](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress).

  Use [Google-managed SSL certificates](https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs)
  for HTTPS.

  ```
  kubectl apply -f manifests/service.yaml
  kubectl apply -f manifests/certificates.yaml
  kubectl apply -f manifests/ingress.yaml
  ```
