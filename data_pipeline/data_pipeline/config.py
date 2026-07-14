import configparser
import os

# Root of the data_pipeline subproject (contains pipeline_config.ini, run_pipeline.py, etc.).
PIPELINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Root of the overall repo, used to resolve local output paths (which are relative) regardless of
# which pipeline script is doing the resolving.
REPO_ROOT = os.path.dirname(PIPELINE_DIR)

pipeline_config = configparser.ConfigParser()

if "HAIL_DATAPROC" in os.environ:
    # `hailctl dataproc start` sets HAIL_DATAPROC on cluster nodes. On a Dataproc job,
    # `gcloud dataproc jobs submit --files=pipeline_config.ini` places the file directly
    # in the job's working directory, so it's found by name alone.
    pipeline_config.read("pipeline_config.ini")
else:
    # Running locally (directly or via run_pipeline.py): read the copy of pipeline_config.ini
    # at the root of the data_pipeline subproject, regardless of the current working directory.
    pipeline_config.read(os.path.join(PIPELINE_DIR, "pipeline_config.ini"))

# Verify that required configuration is set
REQUIRED_CONFIGURATION = [
    ("output", "gcs_output_root"),
    ("output", "local_output_root"),
    ("output", "output_last_updated"),
]
try:
    for section, option in REQUIRED_CONFIGURATION:
        value = pipeline_config.get(section, option)
        assert value
# pylint: disable=broad-exception-raised
except (configparser.NoOptionError, AssertionError) as exc:
    raise ValueError(f"Missing required configuration '{section}.{option}'") from exc


def get_output_root(output_local, is_downloads=False):
    output_location = "local" if output_local else "gcs"
    downloads_string = "_downloads" if is_downloads else ""
    output_root = pipeline_config.get("output", f"{output_location}{downloads_string}_output_root")

    if output_local:
        output_root = os.path.abspath(os.path.join(REPO_ROOT, output_root))

    return output_root
