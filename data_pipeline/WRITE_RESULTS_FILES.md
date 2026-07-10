For the production deployment, results files created by the last step of the data pipeline must be stored
on a Persistent Disk.

A persistent disk can only be [attached to multiple instances](https://cloud.google.com/compute/docs/disks/add-persistent-disk#use_multi_instances)
if it is attached to all those instances in read-only mode. Thus, updating browser data without downtime
requires creating a new disk since any existing disk with current data is attached to the GKE node serving
the browsers and so cannot be attached to another instance in read-write mode.

1. Create a temporary GCE instance.

   ```
   gcloud --quiet compute instances create erb-temp-instance \
      --machine-type=n1-standard-16 \
      --image-family projects/debian-cloud/global/images/family/debian-12 \
      --boot-disk-size=200GB \
      --service-account=erb-data-pipeline@exac-gnomad.iam.gserviceaccount.com
   ```

2. Create a persistent disk and attach it to the instance.

   Change the `LABEL` variable if this is not for prod, e.g. `schema2-demo`

   ```
   LABEL="prod"
   TIMESTAMP=$(date '+%Y-%m-%d--%H-%M')
   DISK_NAME="erb-data-$LABEL-$TIMESTAMP"

   gcloud compute disks create $DISK_NAME \
     --size=200GB \
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

   SSH in

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

   Install Java and uv

   ```
   apt-get update && \
   apt-get install -y \
     openjdk-11-jre-headless \
     g++ \
     libopenblas-base \
     liblapack3 \
     curl

   curl -LsSf https://astral.sh/uv/install.sh | sh
   source $HOME/.local/bin/env
   ```

   Install Hail and tqdm. Versions should be kept in sync with `data_pipeline/pyproject.toml`.

   ```
   uv venv --python 3.12 /tmp/hail-env
   source /tmp/hail-env/bin/activate
   uv pip install "hail==0.2.138" tqdm
   ```

6. Copy results data from GCS.

   ```
   gsutil cp -r gs://exome-results-browsers/output-data/combined/<YYYY-MM-DD_DATE>/combined.ht /tmp
   ```

7. Write results files to persistent disk.

   ```
   /tmp/write_results_files.py /tmp/combined.ht /mnt/disks/erb-data/results --environment gce
   ```

8. Unmount disk.

   ```
   umount /mnt/disks/erb-data
   ```

9. Disconnect from the instance, detach the disk, and delete the instance.

   Exit `su` shell (`#`)

   ```
   exit
   ```

   Exit shell (`$`)

   ```
   exit
   ```

   Detach the disk

   ```
   gcloud compute instances detach-disk erb-temp-instance --disk=$DISK_NAME
   ```

   Delete the temp instance

   ```
   gcloud --quiet compute instances delete erb-temp-instance
   ```

For documentation on using the newly created persisent disk for a demo or production deployment, refer back to [deployment/README.md](../deployment/README.md#deployments)
