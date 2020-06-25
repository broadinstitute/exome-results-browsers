#!/usr/bin/env python3

import os
import subprocess


def main():
    # Set working directory so that config.py finds pipeline_config.ini
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    from data_pipeline.config import pipeline_config  # pylint: disable=import-outside-toplevel

    command = [
        "hailctl",
        "dataproc",
        "stop",
        "exome-results",
    ]

    for option in ["project", "region"]:
        value = pipeline_config.get("dataproc", option, fallback=None)
        if value:
            command.append(f"--{option}={value}")

    print(" ".join(command[:4]) + " \\\n    " + " \\\n    ".join(command[4:]))
    subprocess.check_call(command)


if __name__ == "__main__":
    main()
