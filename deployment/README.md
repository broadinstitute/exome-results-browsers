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

   Debian 11 is used here to have Python 3.9

   ```
   gcloud --quiet compute instances create erb-temp-instance \
      --machine-type=n1-standard-8 \
      --image-family projects/debian-cloud/global/images/family/debian-11 \
      --boot-disk-size=200GB \
      --service-account=erb-data-pipeline@exac-gnomad.iam.gserviceaccount.com
   ```

2. Create a persistent disk and attach it to the instance.

   ```
   TIMESTAMP=$(date '+%Y-%m-%d--%H-%M')
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

   Start interactive root session

   ```
   sudo su -
   ```


   Format the disk, mount the disk
   ```
   mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/disk/by-id/google-erb-data

   mkdir -p /mnt/disks/erb-data
   mount -o discard,defaults /dev/disk/by-id/google-erb-data /mnt/disks/erb-data
   ```

5. Install Hail.

   Install Java 11

   ```
   apt-get update && \
   apt-get install -y \
     openjdk-11-jre-headless \
     g++ \
     python3.9 \
     python3-pip \
     libopenblas-base \
     liblapack3
   ```

   Install Hail and tqdm. Versions should be kept in sync with requirements.txt

   ```
   python3.9 -m pip install hail==0.2.126 tqdm==4.66.5
   ```

6. Copy results data from GCS.

   ```
   gsutil cp -r gs://exome-results-browsers/output-data/combined/<YYYY-MM-DD_DATE>/combined.ht /tmp
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

To use the new disk in a deployed instance of the browsers, modify the respective manifest in the [gnomAD deployments](https://github.com/broadinstitute/gnomad-deployments) repo, then run `kubectl apply -k <DEPLOYMENT>/`

E.g. to update the `demo` deployment's disk to use a newly created one:

- Navigate to `gnomad-deployments/exome-results-browsers`
- Change the `pdName` value in `.../exome-results-browsers/demo/kustomization.yaml`
- VPN into the broad, point your `gcloud` and `kubernetes` at gnomAD (where we deploy the ERBs)
- Run `kubectl apply -k demo/`


## Docker image

The Docker build copies a `build.env` file and reads environment variables from it. Create the `build.env`
file and fill in values for variables.

```
cat <<EOF > build.env
ASC_BROWSER_GA_TRACKING_ID=
BipEx_BROWSER_GA_TRACKING_ID=
Epi25_BROWSER_GA_TRACKING_ID=
SCHEMA_BROWSER_GA_TRACKING_ID=
IBD_BROWSER_GA_TRACKING_ID=
GP2_BROWSER_GA_TRACKING_ID=
DEMO_PASSWORD=
EOF
```

Note that the `DEMO_PASSWORD` should be a string with no `""`s, if quotes are included, the password will include the quotes. e.g. `DEMO_PASSWORD="password"` would require a user to type `"password"` into the box, as opposed to just `password`.

**Build the Docker image. The build script tags the image with the current git revision.**

```
./deployment/build-docker-image.sh
```

or

```
./deployment/build-docker-image.sh --no-cache
```

**(Optional) Re-tag the docker image**


```
docker tag \
  us-docker.pkg.dev/exac-gnomad/gnomad/exome-results-browsers:<OLD_TAG> \
  us-docker.pkg.dev/exac-gnomad/gnomad/exome-results-browsers:<NEW_TAG>
```

Where `<OLD_TAG>` is output by `build-docker-image.sh`

e.g.

```
docker tag \
  us-docker.pkg.dev/exac-gnomad/gnomad/exome-results-browsers:5e495fb-rig_gp2_demo \
  us-docker.pkg.dev/exac-gnomad/gnomad/exome-results-browsers:5e495fb_2025-06-04_gp2-demo
```

**Push the docker image to the artifact registry**

```
docker push us-docker.pkg.dev/exac-gnomad/gnomad/exome-results-browsers:<IMAGE_TAG>
```

e.g.

```
docker push us-docker.pkg.dev/exac-gnomad/gnomad/exome-results-browsers:5e495fb_2025-06-04_gp2-demo
```

## Deployments

This repository contains a base [kubernetes deployment](./manifests/), that is appropriate for extending to your needs using [kustomize](https://kustomize.io/). You can deploy the base configuration as-is, with:

```bash
kubectl apply -k deployment/manifests
```

If you would like to extend your deployment with things like an Ingress, additional environment variables, different docker image tags, etc, you can create a new kustomization in [gnomad-deployments](https://github.com/broadinstitute/gnomad-deployments/blob/main/exome-results-browsers), or a new local directory on your laptop if you don't want to check the kustomization into source control.

### Production Deployment

## Building the Docker image

For production, docker images are automatically built after a push to the main branch. After a successful image build, the cloudbuild runs a task to update update the prod deployment manifest in the [gnomad-deployments](https://github.com/broadinstitute/gnomad-deployments) repository.

## Updating the production kustomization

Updates to the production deployment should happen automatically via Cloudbuild, however, if you need to manually update the production deployment, including its ingress and managed certificate, that can be done in [gnomad-deployments](https://github.com/broadinstitute/gnomad-deployments/blob/main/exome-results-browsers/prod). To update the production deployment, update the image tag or make other changes in the [prod kustomization](https://github.com/broadinstitute/gnomad-deployments/blob/main/exome-results-browsers/prod/kustomization.yaml) and view the changes:

```bash
# view/inspect the updated deployment
cd gnomad-deployments/exome-results-browsers/prod
kustomize build .

```

if all looks as expected, commit the changes back to the main branch of the deployments repository, and our deployment tool will apply them.

## GKE resources

- If you don't already have one, create a GKE cluster, e.g. https://cloud.google.com/kubernetes-engine/docs/how-to/creating-a-zonal-cluster. Our environments are managed in [terraform](https://github.com/broadinstitute/gnomad-terraform).

- If exposing your deployment to the internet, reserve IP address. This is preferably done via terraform in [gnomad-terraform](https://github.com/broadinstitute/gnomad-terraform), but for reference, a global IP address could be reserved with:

  ```
  gcloud compute addresses create exome-results-browsers --global
  ```
