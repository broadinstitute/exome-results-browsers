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

1. Create a temporary GCE instance.

   Debian 11 is used here to get a more up to date version of Python (Debian 10 is the default at the time of this writing).

   ```
   gcloud --quiet compute instances create erb-temp-instance \
      --machine-type=n1-standard-8 \
      --image-family projects/debian-cloud/global/images/family/debian-11 \
      --boot-disk-size=200GB \
      --service-account=erb-data-pipeline@exac-gnomad.iam.gserviceaccount.com
   ```

2. Create a persistent disk and attach it to the instance.

   ```
   TIMESTAMP=$(date '+%y%m%d-%H%M')
   DISK_NAME="exome-results-browsers-data-$TIMESTAMP"

   gcloud compute disks create $DISK_NAME \
     --size=100GB \
     --type=pd-standard

   gcloud compute instances attach-disk erb-temp-instance \
     --disk=$DISK_NAME \
     --device-name=erb-data
   ```

3. Upload script to instance.

   ```
   gcloud --quiet compute scp \
     ./data_pipeline/write_results_files.py \
     erb-temp-instance:/tmp
   ```

4. SSH into the instance and mount and format the disk.

   ```
   gcloud compute ssh erb-temp-instance
   ```

   ```
   mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/disk/by-id/google-erb-data

   mkdir -p /mnt/disks/erb-data
   mount -o discard,defaults /dev/disk/by-id/google-erb-data /mnt/disks/erb-data
   ```

5. Install Hail.

   ```
   apt-get -qq install wget software-properties-common
   wget -qO - https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | apt-key add -
   add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/
   apt-get -qq update
   apt-get -qq install adoptopenjdk-8-hotspot
   apt-get -qq install python3-pip
   pip3 install hail
   pip3 install tqdm
   ```

6. Copy results data from GCS.

   ```
   gsutil -q cp -r gs://exome-results-browsers/data/<DATA-DATE>/combined.ht /tmp
   ```

7. Write results files to persistent disk.

   ```
   /tmp/write_results_files.py /tmp/combined.ht /mnt/disks/erb-data/results
   ```

8. Unmount disk.

   ```
   umount /mnt/disks/erb-data
   ```

9. Disconnect from the instance, detach the disk, and delete the instance.

   ```
   gcloud compute instances detach-disk erb-temp-instance --disk=$DISK_NAME

   gcloud --quiet compute instances delete erb-temp-instance
   ```

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

## Updating Production Deployment

Build the Docker image. When the Docker image is finished building, the script prints the name and tag to the console

```
./deployment/build-docker-image.sh
```

Update the production deployment to the desired Docker image with

```
./deployment/deploy-image.sh <IMAGE-TAG>
```

To update both the production front/backend and the data at the same time, modify the `pdName` value in the volumes section of `deployment/manifests/deployment.yaml` before running the `deploy-image` script.

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

- Create a [Google-managed SSL certificate](https://cloud.google.com/load-balancing/docs/ssl-certificates/google-managed-certs).

  ```
  gcloud compute ssl-certificates create exome-results-browsers-cert --global \
    --domains=asc.broadinstitute.org,bipex.broadinstitute.org,epi25.broadinstitute.org,schema.broadinstitute.org
  ```

- Expose deployment with an [Ingress](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress).

  ```
  kubectl apply -f manifests/service.yaml
  kubectl apply -f manifests/frontendconfig.yaml
  kubectl apply -f manifests/ingress.yaml
  ```
