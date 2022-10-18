#!/usr/bin/env python3

import argparse
import os
import subprocess
import sys
import tempfile
import time
import zipfile


PIPELINES = [
    "prepare_gene_models",
    "prepare_datasets",
    "prepare_downloads",
    "combine_datasets",
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pipeline", choices=PIPELINES, help="Pipeline to run")
    parser.add_argument(
        "--environment",
        choices=("local", "dataproc"),
        default="local",
        help="Environment in which to run the pipeline (defaults to %(default)s",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print pipeline command without running it")
    args, other_args = parser.parse_known_args()

    # Set working directory so that config.py finds pipeline_config.ini
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    from data_pipeline.config import pipeline_config  # pylint: disable=import-outside-toplevel

    start_time = time.time()

    if args.environment == "local":
        command = ["python3", "-m", f"data_pipeline.pipelines.{args.pipeline}"]

        if other_args:
            command.extend(other_args)

        print(" ".join(command[:2]) + " \\\n    " + " \\\n    ".join(command[2:]))
        if not args.dry_run:
            sys.path.insert(1, os.getcwd())
            try:
                subprocess.check_call(
                    command,
                    env={
                        **os.environ,
                        "PYSPARK_SUBMIT_ARGS": "--driver-memory 4g pyspark-shell",
                    },
                )

                elapsed_time = time.time() - start_time
                print(f"Done in {int(elapsed_time // 60)}m{int(elapsed_time % 60)}s")

            except subprocess.CalledProcessError:
                print(f"Error running data_pipeline/pipelines/{args.pipeline}.py")
                sys.exit(1)

    elif args.environment == "dataproc":
        # Zip contents of data_pipeline directory for upload to Dataproc cluster
        with tempfile.NamedTemporaryFile(prefix="pyfiles_", suffix=".zip") as tmp_file:
            with zipfile.ZipFile(tmp_file.name, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for root, _, files in os.walk("data_pipeline"):
                    for name in files:
                        if name.endswith(".py"):
                            zip_file.write(
                                os.path.join(root, name),
                                os.path.relpath(os.path.join(root, name)),
                            )

            # `hailctl dataproc submit` does not support project/region/zone arguments,
            # so use `gcloud dataproc jobs submit` instead.
            command = [
                "gcloud",
                "dataproc",
                "jobs",
                "submit",
                "pyspark",
            ]

            for option in ["project", "region"]:
                value = pipeline_config.get("dataproc", option, fallback=None)
                if value:
                    command.append(f"--{option}={value}")

            command.extend(
                [
                    "--cluster=exome-results",
                    f"--py-files={tmp_file.name}",
                    "--files=pipeline_config.ini",
                    f"data_pipeline/pipelines/{args.pipeline}.py",
                ]
            )

            if other_args:
                command.append("--")
                command.extend(other_args)

            print(" ".join(command[:5]) + " \\\n    " + " \\\n    ".join(command[5:]))
            if not args.dry_run:
                subprocess.check_call(command)

                elapsed_time = time.time() - start_time
                print(f"Done in {elapsed_time // 60}m{elapsed_time % 60}s")


if __name__ == "__main__":
    main()
