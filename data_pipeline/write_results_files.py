#!/usr/bin/env python3

import argparse
import csv
import json
from json.encoder import encode_basestring_ascii, _make_iterencode
import multiprocessing
import os
import sys

import hail as hl
from tqdm import tqdm

INFINITY = float("inf")


class ResultEncoder(json.JSONEncoder):
    """
    JSON encoder that supports Hail Structs and limits precision of floats.
    """

    def default(self, o):  # pylint: disable=method-hidden
        if isinstance(o, hl.Struct):
            return dict(o)

        return super().default(o)

    def iterencode(self, o, _one_shot=False):
        def floatstr(o, **kwargs):  # pylint: disable=unused-argument
            if o != o:
                return '"NaN"'
            elif o == INFINITY:
                return '"Infinity"'
            elif o == -INFINITY:
                return '"-Infinity"'

            return "{:.5g}".format(o)

        _iterencode = _make_iterencode(
            {},
            self.default,
            encode_basestring_ascii,
            None,  # indent,
            floatstr,
            ":",  # key_separator,
            ",",  # item_separator,
            False,  #  sort_keys,
            False,  #  skipkeys,
            _one_shot,
        )
        return _iterencode(o, 0)


def split_data(row):
    gene_id = row[0]
    gene = json.loads(row[1])
    all_variants = gene.pop("variants")
    gene_grch37 = gene.pop("GRCh37")
    gene_grch38 = gene.pop("GRCh38")

    if gene_grch37:
        gene_grch37 = {**gene, "reference_genome": "GRCh37", **gene_grch37}
        gene_grch37 = json.dumps({"gene": gene_grch37}, cls=ResultEncoder)

    if gene_grch38:
        gene_grch38 = {**gene, "reference_genome": "GRCh38", **gene_grch38}
        gene_grch38 = json.dumps({"gene": gene_grch38}, cls=ResultEncoder)

    all_variants = {k: json.dumps({"variants": v}, cls=ResultEncoder) for k, v in all_variants.items()}

    return gene_id, gene_grch37, gene_grch38, all_variants


def write_gene_summary_file(output_directory, ds):
    os.makedirs(output_directory, exist_ok=True)

    with open(f"{output_directory}/metadata.json", mode="w", encoding="utf-8") as output_file:
        output_file.write(hl.eval(hl.json(ds.globals.meta)))

    gene_search_terms = ds.select(data=hl.json(hl.tuple([ds.gene_id, ds.search_terms])))
    gene_search_terms.key_by().select("data").export(f"{output_directory}/gene_search_terms.json.txt", header=False)
    os.remove(f"{output_directory}/.gene_search_terms.json.txt.crc")

    ds = ds.drop("previous_symbols", "alias_symbols", "search_terms")

    os.makedirs(f"{output_directory}/results", exist_ok=True)
    for dataset in ds.globals.meta.datasets.dtype.fields:
        reference_genome = "GRCh38" if dataset in ["bipex", "ibd"] else "GRCh37"
        gene_results = ds.filter(hl.is_defined(ds.gene_results[dataset]))
        gene_results = gene_results.select(
            result=hl.tuple(
                [
                    gene_results.gene_id,
                    gene_results.symbol,
                    gene_results.name,
                    gene_results[reference_genome].chrom,
                    (gene_results[reference_genome].start + gene_results[reference_genome].stop) // 2,
                    gene_results.gene_results[dataset].group_results,
                ]
            )
        )
        gene_results = gene_results.collect()

        gene_results = [r.result for r in gene_results]

        with open(f"{output_directory}/results/{dataset.lower()}.json", mode="w", encoding="utf-8") as output_file:
            output_file.write(json.dumps({"results": gene_results}, cls=ResultEncoder))


def write_json_files(output_directory, tsv_filename, n_rows):
    csv.field_size_limit(sys.maxsize)
    os.makedirs(f"{output_directory}/genes", exist_ok=True)

    with multiprocessing.get_context("spawn").Pool() as pool:
        with open(f"{output_directory}/{tsv_filename}", encoding="utf-8") as data_file:

            reader = csv.reader(data_file, delimiter="\t")
            for gene_id, gene_grch37, gene_grch38, all_variants in tqdm(pool.imap(split_data, reader), total=n_rows):
                num = int(gene_id.lstrip("ENSGR"))
                gene_dir = f"{output_directory}/genes/{str(num % 1000).zfill(3)}"
                os.makedirs(gene_dir, exist_ok=True)

                if gene_grch37:
                    with open(f"{gene_dir}/{gene_id}_GRCh37.json", mode="w", encoding="utf-8") as out_file:
                        out_file.write(gene_grch37)

                if gene_grch38:
                    with open(f"{gene_dir}/{gene_id}_GRCh38.json", mode="w", encoding="utf-8") as out_file:
                        out_file.write(gene_grch38)

                for dataset, dataset_variants in all_variants.items():
                    if dataset_variants:
                        with open(
                            f"{gene_dir}/{gene_id}_{dataset.lower()}_variants.json", mode="w", encoding="utf-8"
                        ) as out_file:
                            out_file.write(dataset_variants)

    os.remove(f"{output_directory}/{tsv_filename}")
    os.remove(f"{output_directory}/.{tsv_filename}.crc")


def process_variants_iteratively(output_directory, ds):
    def output_expected_time(it):
        print(f"Iterations remaining: {it}")
        expected_time_minutes = it * 2.5
        expected_time_hours = int(expected_time_minutes // 60)
        remaining_minutes = int(expected_time_minutes % 60)
        if expected_time_hours == 0:
            print(f"Expected time = {remaining_minutes}m")
        else:
            print(f"Expected time = {expected_time_hours}h{remaining_minutes}m")

    # (<chromosome> , <number of chunks>)
    chroms = [
        ("1", 5),
        ("2", 7),  # Chr2 has TTN
        ("3", 8),  # Chr3 has CNTNAP3
        ("4", 7),
        ("5", 7),
        ("6", 7),
        ("7", 6),
        ("8", 8),  # Chr8 has CSMD1, ADAMTS9
        ("9", 6),  # Chr8 has PTPRD
        ("10", 6),
        ("11", 8),
        ("12", 6),
        ("13", 3),
        ("14", 3),
        ("15", 3),
        ("16", 3),  # Chr16 has RBFOX1, WWOX
        ("17", 3),
        ("18", 3),
        ("19", 2),
        ("20", 2),  # Chr20 has LRP1B
        ("21", 1),
        ("22", 1),
        ("X", 1),
        ("Y", 1),
    ]

    it = 0
    for ch in chroms:
        it += ch[1]
    output_expected_time(it)

    # filter out large individual genes to avoid Hail OOM errors
    large_gene_symbols = hl.set(["TTN", "CNTNAP3", "CSMD1", "ADAMTS9", "PTPRD", "WWOX", "RBFOX1", "LRP1B"])
    ds = ds.filter(large_gene_symbols.contains(ds.symbol), keep=False)

    for chrom in chroms:
        chro = chrom[0]
        chunks = chrom[1]
        print(f"\nLooping for just chr{chro}")

        for i in range(chunks):
            print(f" -- chr{chro} - Loop ({i + 1}/{chunks})")

            filtered = ds.filter(ds.GRCh38.chrom == chro)
            filtered = filtered.filter(filtered.GRCh38.start % chunks == i)

            temp_file_name = f"temp_chr{chro}-{i+1}.tsv"
            n_rows = filtered.count()
            filtered.select(data=hl.json(filtered.row)).export(f"{output_directory}/{temp_file_name}", header=False)

            write_json_files(output_directory, temp_file_name, n_rows)

            it -= 1
            output_expected_time(it)

    return


def write_data_files(table_path, output_directory, genes=None):
    if output_directory.startswith("gs://"):
        raise ValueError("Google Storage paths are not supported for output_directory")

    ds = hl.read_table(table_path)

    write_gene_summary_file(output_directory, ds)

    if genes:
        ds = ds.filter(hl.set(genes).contains(ds.gene_id))

        temp_file_name = "temp.tsv"
        n_rows = ds.count()
        ds.select(data=hl.json(ds.row)).export(f"{output_directory}/{temp_file_name}", header=False)

        write_json_files(output_directory, temp_file_name, n_rows)

        return
    else:
        process_variants_iteratively(output_directory, ds)

        return


def init_hail(env="local"):
    if env == "local":
        print("Running with default hail pyspark settings")
        hl.init()
    elif env == "gce":
        # tailored to n1-standard-16 used in deployment/README.md
        print("Running with pyspark settings tailored to n1-standard-16")
        hl.init(
            # Feb 21, 2025. Copied settings from Hail's dataproc start source
            spark_conf={
                "spark.driver.memory": "49g",
                "spark.executor.memory": "11g",
                "spark.executor.memoryOverhead": "3g",
                "spark.executor.cores": "4",
                "yarn:yarn.nodemanager.resource.memory-mb": "58982",
                "yarn:yarn.scheduler.maximum-allocation-mb": "14745",
                "spark:spark.memory.storageFraction": "0.2",
                "spark.task.maxFailures": "20",
                "spark.driver.extraJavaOptions": "-Xss4M",
                "spark.executor.extraJavaOptions": "-Xss4M",
                "spark.speculation": "true",
            }
        )
    else:
        print(f"Unrecognized environment: {env}!")
        exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("combined_hail_table")
    parser.add_argument("output_directory")
    parser.add_argument("--genes", nargs="+")
    parser.add_argument(
        "--environment",
        choices=["local", "gce"],
        default="local",
        help="Execution environment - local or Google Compute Engine (GCP)",
    )
    args = parser.parse_args()

    init_hail(args.environment)

    write_data_files(args.combined_hail_table, args.output_directory, args.genes)

    print("Finished")
