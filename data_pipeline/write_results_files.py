#!/usr/bin/env python3

import argparse
import csv
import glob
import json
import multiprocessing
import os
import shutil
import sys
from json.encoder import _make_iterencode, encode_basestring_ascii

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

            return f"{o:.5g}"

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

        with open(
            f"{output_directory}/results/{dataset.lower()}.json",
            mode="w",
            encoding="utf-8",
        ) as output_file:
            output_file.write(json.dumps({"results": gene_results}, cls=ResultEncoder))


def write_json_files(output_directory, tsv_dirname, n_rows):
    csv.field_size_limit(sys.maxsize)
    os.makedirs(f"{output_directory}/genes", exist_ok=True)

    def iter_part_files(directory):
        for part_file in glob.glob(f"{directory}/part-*"):
            with open(part_file, encoding="utf-8") as data_file:
                reader = csv.reader(data_file, delimiter="\t")
                yield from reader

    with multiprocessing.get_context("spawn").Pool() as pool:
        row_generator = iter_part_files(f"{output_directory}/{tsv_dirname}")
        for gene_id, gene_grch37, gene_grch38, all_variants in tqdm(pool.imap(split_data, row_generator), total=n_rows):
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
                        f"{gene_dir}/{gene_id}_{dataset.lower()}_variants.json",
                        mode="w",
                        encoding="utf-8",
                    ) as out_file:
                        out_file.write(dataset_variants)

    shutil.rmtree(f"{output_directory}/{tsv_dirname}")


def write_data_files(table_path, output_directory, genes=None):
    if output_directory.startswith("gs://"):
        raise ValueError("Google Storage paths are not supported for output_directory")

    ds = hl.read_table(table_path)

    write_gene_summary_file(output_directory, ds)

    if genes:
        ds = ds.filter(hl.set(genes).contains(ds.gene_id))

        temp_dir_name = "temp_parts"
        n_rows = ds.count()
        ds.select(data=hl.json(ds.row)).export(
            f"{output_directory}/{temp_dir_name}",
            header=False,
            parallel="separate_header",
        )

        write_json_files(output_directory, temp_dir_name, n_rows)

        return

    else:
        print("Writing out files in a single step...")

        expected_datasets = [
            "ASC",
            "BipEx",
            "BipEx2",
            "Epi25",
            "GP2",
            "IBD",
            "SCHEMA",
            "SCHEMA2",
            "ClinVarGRCh38",
        ]

        counts_expr = {}
        for name in expected_datasets:
            if name in ds.variants:
                counts_expr[name] = hl.or_else(hl.len(ds.variants[name]), 0)
            else:
                counts_expr[name] = 0

        ds = ds.annotate(variant_counts=hl.struct(**counts_expr))

        ds = ds.annotate(
            total_variants=(
                ds.variant_counts.ASC
                + ds.variant_counts.BipEx
                + ds.variant_counts.BipEx2
                + ds.variant_counts.Epi25
                + ds.variant_counts.GP2
                + ds.variant_counts.IBD
                + ds.variant_counts.SCHEMA
                + ds.variant_counts.SCHEMA2
                + ds.variant_counts.ClinVarGRCh38
            )
        )

        VARIANT_THRESHOLD = 200_000

        ds_large_genes = ds.filter(ds.total_variants > VARIANT_THRESHOLD)
        large_gene_symbols = ds_large_genes.symbol.collect()

        print(f"Removing {len(large_gene_symbols)} genes with > {VARIANT_THRESHOLD:,} variants:")
        for symbol in large_gene_symbols:
            print(f" - {symbol}")

        ds_filtered = ds.filter(ds.total_variants <= VARIANT_THRESHOLD)
        ds_filtered = ds_filtered.drop("variant_counts", "total_variants")

        temp_dir_name = "temp_parts"
        n_rows = ds_filtered.count()

        ds_filtered = ds_filtered.repartition(500)

        ds_filtered.select(data=hl.json(ds_filtered.row)).export(
            f"{output_directory}/{temp_dir_name}",
            header=False,
            parallel="separate_header",
        )

        write_json_files(output_directory, temp_dir_name, n_rows)

        return


def init_hail(env="local"):
    if env == "local":
        print("Running with default hail pyspark settings")
        # hl.init()
        hl.init(
            spark_conf={
                "spark.driver.bindAddress": "127.0.0.1",
                "spark.driver.host": "127.0.0.1",
            },
        )
    elif env == "gce":
        # tailored to n1-standard-32 used in deployment/README.md
        print("Running with pyspark settings tailored to n1-standard-32")
        hl.init(
            spark_conf={
                # Driver
                "spark.driver.memory": "96g",
                # Executor configuration: 4 executors × 8 cores
                "spark.executor.memory": "20g",
                "spark.executor.memoryOverhead": "4g",
                "spark.executor.cores": "8",
                # YARN memory limits
                "yarn:yarn.nodemanager.resource.memory-mb": "117964",
                "yarn:yarn.scheduler.maximum-allocation-mb": "24576",
                # Other settings
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
