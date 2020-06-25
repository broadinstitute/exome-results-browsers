import configparser

# This configuration file will be read in three places:
# 1. By run.py when starting a pipeline
# 2. By pipelines when running locally
# 3. By pipelines on a Dataproc cluster
#
# In all cases, pipeline_config.ini should be in the current working directory.
# In the first two, run.py sets the working directory to the directory containing pipeline_config.ini.
# In the third, the `--files` argument of `gcloud dataproc jobs submit` is used to upload pipeline_config.ini
# to the Dataproc cluster, where it is placed in the job's working directory.
pipeline_config = configparser.ConfigParser()
pipeline_config.read("pipeline_config.ini")

# Verify that required configuration is set
REQUIRED_CONFIGURATION = [("output", "staging_path")]
try:
    for section, option in REQUIRED_CONFIGURATION:
        value = pipeline_config.get(section, option)
        assert value
except (configparser.NoOptionError, AssertionError):
    raise Exception(f"Missing required configuration '{section}.{option}'")
