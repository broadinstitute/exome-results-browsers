"""Shared pytest setup for the data pipeline tests.

Two import-time concerns are handled here, before any test module is imported:

1. ``data_pipeline`` lives at ``<repo>/data_pipeline/data_pipeline``, and
   ``write_results_files.py`` lives at ``<repo>/data_pipeline``. Both parents
   have to be importable. ``sys.path`` is also inherited by the
   ``multiprocessing`` spawn workers that ``write_results_files`` starts.
2. ``data_pipeline.config`` reads ``pipeline_config.ini`` from the *current
   working directory* at import time and raises if it is missing. The working
   directory is switched only for the duration of that import, so tests do not
   run with a surprising cwd.
"""

import os
import sys
from pathlib import Path

import pytest

PIPELINE_DIR = Path(__file__).resolve().parents[1]

if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

_original_cwd = os.getcwd()
os.chdir(PIPELINE_DIR)
try:
    from data_pipeline.config import pipeline_config
finally:
    os.chdir(_original_cwd)


def pytest_addoption(parser):
    parser.addoption(
        "--snapshot-update",
        action="store_true",
        default=False,
        help="Rewrite the committed snapshot files from the current pipeline output.",
    )


@pytest.fixture(scope="session", autouse=True)
def hail_context():
    """Initialise Hail once per session; JVM startup dominates these tests."""
    import hail as hl

    hl.init(
        spark_conf={
            "spark.driver.bindAddress": "127.0.0.1",
            "spark.driver.host": "127.0.0.1",
        },
        idempotent=True,
        quiet=True,
        skip_logging_configuration=True,
    )
    yield
    hl.stop()


@pytest.fixture(scope="session")
def test_pipeline_config():
    """Point the pipeline config's date folders and dataset list at the fixtures.

    ``combine_datasets`` takes ``output_root`` as an argument, so only the
    ``output_last_updated`` dates and the dataset list need overriding.
    """
    from .fixtures.synthetic_inputs import DATASET_IDS, OUTPUT_DATE

    sections = ["reference_data", "output", "datasets", *DATASET_IDS]
    saved = {
        section: dict(pipeline_config[section]) if pipeline_config.has_section(section) else None
        for section in sections
    }

    try:
        for section in sections:
            if not pipeline_config.has_section(section):
                pipeline_config.add_section(section)
        pipeline_config.set("datasets", "datasets", ",".join(DATASET_IDS))
        pipeline_config.set("reference_data", "output_last_updated", OUTPUT_DATE)
        pipeline_config.set("output", "output_last_updated", OUTPUT_DATE)
        for dataset_id in DATASET_IDS:
            pipeline_config.set(dataset_id, "output_last_updated", OUTPUT_DATE)
        yield pipeline_config
    finally:
        for section, values in saved.items():
            pipeline_config.remove_section(section)
            if values is not None:
                pipeline_config.add_section(section)
                for key, value in values.items():
                    pipeline_config.set(section, key, value)
