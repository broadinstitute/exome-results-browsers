#!/usr/bin/env python3

import argparse
import os
import subprocess


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print cluster creation command without running it")
    args = parser.parse_args()

    # Set working directory so that config.py finds pipeline_config.ini
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    from data_pipeline.config import pipeline_config  # pylint: disable=import-outside-toplevel

    command = [
        "hailctl",
        "dataproc",
        "start",
        "exome-results",
        "--max-idle=1h",
    ]

    for option in ["project", "region", "zone", "service-account"]:
        value = pipeline_config.get("dataproc", option, fallback=None)
        if value:
            command.append(f"--{option}={value}")

    print(" ".join(command[:4]) + " \\\n    " + " \\\n    ".join(command[4:]))
    if not args.dry_run:
        subprocess.check_call(command)


if __name__ == "__main__":
    main()
