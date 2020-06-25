# Deployment

## Data preparation

See [data_pipeline/README.md](../data_pipeline/README.md) for instructions on running the data pipeline.

## Results files

For the production deployment, results files created by the last step of the data pipeline must be stored
on a Persistent Disk.

- [Create a Persistent Disk](https://cloud.google.com/compute/docs/disks/add-persistent-disk).

  Make sure the disk is in the same zone as the server to which it will be attached.

  ```
  gcloud compute disks create exome-results-browsers-data \
    --size 200GB \
    --type pd-standard
  ```

- [Create a Compute Engine instance](https://cloud.google.com/compute/docs/instances/create-start-instance).

  ```
  gcloud compute --project=exac-gnomad instances create INSTANCE_NAME \
      --machine-type=n1-standard-8 \
      --boot-disk-size=100GB
  ```

- Attach the disk to the instance.

  ```
  gcloud compute instances attach-disk INSTANCE_NAME \
    --disk exome-results-browsers-data
  ```

- [Format and mount the disk](https://cloud.google.com/compute/docs/disks/add-persistent-disk#formatting).

- Connect to instance and install Hail.

  ```
  gcloud compute ssh INSTANCE_NAME
  ```

  ```
  sudo apt-get -qq install wget software-properties-common
  wget -qO - https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | sudo apt-key add -
  sudo add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/
  sudo apt-get -qq update
  sudo apt-get -qq install adoptopenjdk-8-hotspot
  sudo apt-get -qq install python3.7 python3-pip
  pip3 install --user hail
  ```

- Copy combined Hail table to instance.

  ```
  gsutil -m cp -r /path/to/combined.ht ./
  ```

- Copy `write_results_files.py` to instance.

  ```
  gcloud compute scp data_pipeline/write_results_files.py INSTANCE_NAME:~
  ```

- Write results files to persistent disk.

  ```
  ./write_results_files.py ./combined.ht /mnt/disks/diskname/path/to/directory
  ```

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

- Expose deployment with an [Ingress](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress).

  Use [Google-managed SSL certificates](https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs)
  for HTTPS.

  ```
  kubectl apply -f manifests/service.yaml
  kubectl apply -f manifests/certificates.yaml
  kubectl apply -f manifests/ingress.yaml
  ```
