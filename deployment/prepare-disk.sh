#!/bin/sh -eu

print_usage() {
  SCRIPT_NAME=$(basename $0)
  echo "Usage: $SCRIPT_NAME combined_results_table" 1>&2
}

# Check if this script is running on a GCE machine by attempting to connect to the metadata server
is_gce() {
  curl --silent metadata.google.internal > /dev/null 2>&1
  return $?
}

if ! is_gce; then
  # Require one argument (URL of combined results table)
  if [ $# -ne 1 ]; then
    print_usage
    exit 1
  fi

  RESULTS_TABLE=${1%/} # Remove trailing slash from table URL

  # Check that a GCS URL was provided
  case $RESULTS_TABLE in
    "gs://"*);;
    *) echo "Error: Expected gs:// URL for results table"; exit 1;;
  esac

  # Generate names for instance and persistent disk
  TIMESTAMP=$(date '+%y%m%d-%H%M')
  INSTANCE_NAME="temp-erb-data-instance-$TIMESTAMP"
  DISK_NAME="exome-results-browsers-data-$TIMESTAMP"

  echo "Creating instance $INSTANCE_NAME to run script"
  echo "To view logs, use:"
  echo "  gcloud compute ssh $INSTANCE_NAME --command='sudo journalctl -f -o cat -u google-startup-scripts.service'"

  # Create a GCE instance that runs this script on startup
  # https://cloud.google.com/compute/docs/startupscript#using-a-local-startup-script-file
  # Pass results table URL using instance metadata
  # https://cloud.google.com/compute/docs/startupscript#custom
  gcloud --quiet compute instances create $INSTANCE_NAME \
    --machine-type=n1-standard-8 \
    --boot-disk-size=200GB \
    --scopes=default,compute-rw \
    --metadata-from-file="startup-script=$0" \
    --metadata="results-table=$RESULTS_TABLE,results-disk-name=$DISK_NAME"

  # Wait for the instance to accept SSH connections
  IP=$(gcloud compute instances describe $INSTANCE_NAME --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
  until nc -w 1 -z $IP 22; do
    sleep 5
  done

  # Upload write_results_files.py to instance
  # Note: This count be sent through instance metadata instead of SCP
  DEPLOYMENT_DIR=$(dirname "$0")
  gcloud --quiet compute scp \
    "${DEPLOYMENT_DIR}/../data_pipeline/write_results_files.py" \
    $INSTANCE_NAME:/tmp

  # Wait for script to run
  # It will delete the instance when it has finished
  # TODO: Add some timeout to prompt to check for errors
  echo "Waiting for result files to be written to $DISK_NAME... (this will take several minutes)"
  while gcloud compute instances describe $INSTANCE_NAME >/dev/null 2>&1; do
    sleep 60
  done

  echo "Done"

  # Remainder of this script runs on the GCE instance
  exit 0
fi

###############################################################################
# This section of the script runs on the GCE instance
###############################################################################

# Retrieve information from instance metadata
# https://cloud.google.com/compute/docs/storing-retrieving-metadata#project-instance-metadata
get_instance_metadata() {
  curl --silent --header "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/$1"
}

INSTANCE_NAME=$(get_instance_metadata name)
ZONE=$(get_instance_metadata zone | awk  'BEGIN { FS="/" }; { print $4 }')

RESULTS_TABLE_URL=$(get_instance_metadata attributes/results-table)
DISK_NAME=$(get_instance_metadata attributes/results-disk-name)

# Create and attach a persistent disk
# https://cloud.google.com/compute/docs/disks/add-persistent-disk#create_disk
gcloud compute disks create $DISK_NAME \
  --zone=$ZONE \
  --size=100GB \
  --type=pd-standard

# Specify the disk's device name so that we know which device file to use when formatting/mounting the disk
DEVICE_NAME=browser-data

gcloud compute instances attach-disk $INSTANCE_NAME \
  --zone=$ZONE \
  --disk=$DISK_NAME \
  --device-name=$DEVICE_NAME

# Format and mount the disk
# https://cloud.google.com/compute/docs/disks/add-persistent-disk#formatting
MOUNT_POINT=/mnt/disks/results-data

mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/disk/by-id/google-$DEVICE_NAME

mkdir -p $MOUNT_POINT
mount -o discard,defaults /dev/disk/by-id/google-$DEVICE_NAME $MOUNT_POINT

# Install Hail
apt-get -qq install wget software-properties-common
wget -qO - https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | apt-key add -
add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/
apt-get -qq update
apt-get -qq install adoptopenjdk-8-hotspot
apt-get -qq install python3.7 python3-pip
pip3 install hail

# Copy results data from GCS bucket
gsutil -q cp -r $RESULTS_TABLE_URL /tmp

# Write results files
RESULTS_TABLE_NAME=$(basename $RESULTS_TABLE_URL)
/tmp/write_results_files.py /tmp/$RESULTS_TABLE_NAME $MOUNT_POINT/results

# Unmount and detach disk
umount $MOUNT_POINT

gcloud compute instances detach-disk $INSTANCE_NAME \
  --zone=$ZONE \
  --disk=$DISK_NAME

# Delete the instance
gcloud --quiet compute instances delete $INSTANCE_NAME --zone=$ZONE
