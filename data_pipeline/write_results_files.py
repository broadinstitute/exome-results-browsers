#!/usr/bin/env python3

import argparse
import csv
import glob
import json
import multiprocessing
import os
import shutil
import sys
import tempfile
from json.encoder import _make_iterencode, encode_basestring_ascii

import hail as hl
from tqdm import tqdm

INFINITY = float("inf")
RESULT_FILE_MODE = 0o644
VARIANT_THRESHOLD = 200_000
VARIANT_CHUNK_SIZE = 10_000
EXPECTED_DATASETS = [
    "ASC",
    "ASC2",
    "BipEx",
    "Epi25",
    "GP2",
    "IBD",
    "SCHEMA",
    "ClinVarGRCh38",
]


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


def split_gene_document(row):
    gene_id = row[0]
    gene = json.loads(row[1])
    gene_grch37 = gene.pop("GRCh37")
    gene_grch38 = gene.pop("GRCh38")

    if gene_grch37:
        gene_grch37 = {**gene, "reference_genome": "GRCh37", **gene_grch37}
        gene_grch37 = json.dumps({"gene": gene_grch37}, cls=ResultEncoder)

    if gene_grch38:
        gene_grch38 = {**gene, "reference_genome": "GRCh38", **gene_grch38}
        gene_grch38 = json.dumps({"gene": gene_grch38}, cls=ResultEncoder)

    return gene_id, gene_grch37, gene_grch38


def assemble_variant_chunks(output_path, chunk_files, expected_chunk_count, expected_variant_count):
    if os.path.exists(output_path):
        os.remove(output_path)

    chunk_indices = [chunk_index for chunk_index, _ in chunk_files]
    if len(chunk_indices) != len(set(chunk_indices)):
        raise ValueError(f"Duplicate chunks for {output_path}")

    expected_chunk_indices = list(range(expected_chunk_count))
    if sorted(chunk_indices) != expected_chunk_indices:
        raise ValueError(
            f"Invalid chunks for {output_path}: expected {expected_chunk_indices}, observed {sorted(chunk_indices)}"
        )

    output_directory = os.path.dirname(output_path)
    os.makedirs(output_directory, exist_ok=True)
    temp_file = tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=output_directory,
        prefix=f".{os.path.basename(output_path)}.",
        suffix=".tmp",
        delete=False,
    )
    temp_path = temp_file.name
    written_variant_count = 0

    try:
        with temp_file:
            temp_file.write('{"variants":[')
            needs_comma = False
            for _, chunk_path in sorted(chunk_files):
                with open(chunk_path, encoding="utf-8") as chunk_file:
                    variants = json.load(chunk_file)
                for variant in variants:
                    if needs_comma:
                        temp_file.write(",")
                    temp_file.write(json.dumps(variant, cls=ResultEncoder))
                    needs_comma = True
                    written_variant_count += 1
            temp_file.write("]}")

        if written_variant_count != expected_variant_count:
            raise ValueError(
                f"Invalid variant count for {output_path}: expected {expected_variant_count}, "
                f"wrote {written_variant_count}"
            )

        os.chmod(temp_path, RESULT_FILE_MODE)
        os.replace(temp_path, output_path)
    except BaseException:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise

    return written_variant_count, os.path.getsize(output_path)


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
        reference_genome = hl.eval(ds.globals.meta.datasets[dataset].reference_genome)
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
                for row in reader:
                    yield row

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


def write_oversized_gene_documents(output_directory, ds, n_rows):
    temp_dir_name = "temp_oversized_gene_parts"
    gene_fields = ds.drop("variants", "variant_counts", "total_variants")
    gene_fields.select(data=hl.json(gene_fields.row)).export(
        f"{output_directory}/{temp_dir_name}",
        header=False,
        parallel="separate_header",
    )

    written_documents = {}
    csv.field_size_limit(sys.maxsize)

    def iter_part_files(directory):
        for part_file in glob.glob(f"{directory}/part-*"):
            with open(part_file, encoding="utf-8") as data_file:
                yield from csv.reader(data_file, delimiter="\t")

    with multiprocessing.get_context("spawn").Pool() as pool:
        rows = iter_part_files(f"{output_directory}/{temp_dir_name}")
        for gene_id, gene_grch37, gene_grch38 in tqdm(pool.imap(split_gene_document, rows), total=n_rows):
            num = int(gene_id.lstrip("ENSGR"))
            gene_dir = f"{output_directory}/genes/{str(num % 1000).zfill(3)}"
            os.makedirs(gene_dir, exist_ok=True)
            gene_document_paths = []

            if gene_grch37:
                output_path = f"{gene_dir}/{gene_id}_GRCh37.json"
                with open(output_path, mode="w", encoding="utf-8") as output_file:
                    output_file.write(gene_grch37)
                gene_document_paths.append(output_path)

            if gene_grch38:
                output_path = f"{gene_dir}/{gene_id}_GRCh38.json"
                with open(output_path, mode="w", encoding="utf-8") as output_file:
                    output_file.write(gene_grch38)
                gene_document_paths.append(output_path)

            written_documents[gene_id] = gene_document_paths

    shutil.rmtree(f"{output_directory}/{temp_dir_name}")
    return written_documents


def export_oversized_variant_chunks(output_directory, ds, dataset_ids, oversized_genes):
    temp_directory = f"{output_directory}/temp_oversized_variant_parts"

    for dataset_id in dataset_ids:
        total_variant_count = sum(gene["variant_counts"][dataset_id] for gene in oversized_genes)
        total_chunk_count = sum(
            (gene["variant_counts"][dataset_id] + VARIANT_CHUNK_SIZE - 1) // VARIANT_CHUNK_SIZE
            for gene in oversized_genes
        )
        print(
            f"Exporting {dataset_id}: {total_variant_count:,} variants in {total_chunk_count:,} chunks",
            flush=True,
        )
        source_variant_count = hl.len(ds.variants[dataset_id])
        chunk_count = (source_variant_count + VARIANT_CHUNK_SIZE - 1) // VARIANT_CHUNK_SIZE
        chunk_rows = ds.select(
            dataset_variants=ds.variants[dataset_id],
            source_variant_count=source_variant_count,
            chunk_count=chunk_count,
            chunk_index=hl.range(0, chunk_count),
        ).explode("chunk_index")
        chunk_start = chunk_rows.chunk_index * VARIANT_CHUNK_SIZE
        chunk_rows.select(
            dataset=hl.literal(dataset_id),
            chunk_index=chunk_rows.chunk_index,
            chunk_count=chunk_rows.chunk_count,
            source_variant_count=chunk_rows.source_variant_count,
            data=hl.json(chunk_rows.dataset_variants[chunk_start : chunk_start + VARIANT_CHUNK_SIZE]),
        ).export(
            f"{temp_directory}/{dataset_id}",
            header=False,
            parallel="separate_header",
        )
        print(f"Finished exporting {dataset_id}", flush=True)

    return temp_directory


def stage_oversized_variant_chunks(temp_directory, staging_directory, expected_variants):
    if os.path.exists(staging_directory):
        shutil.rmtree(staging_directory)
    os.makedirs(staging_directory)

    staged_chunks = {key: [] for key in expected_variants}
    observed_chunk_indices = {key: set() for key in expected_variants}
    total_chunk_count = sum(
        (variant_count + VARIANT_CHUNK_SIZE - 1) // VARIANT_CHUNK_SIZE for variant_count in expected_variants.values()
    )

    def iter_exported_chunk_rows():
        for dataset_directory in glob.glob(f"{temp_directory}/*"):
            for part_file in glob.glob(f"{dataset_directory}/part-*"):
                with open(part_file, encoding="utf-8") as data_file:
                    yield from csv.reader(data_file, delimiter="\t")

    rows = iter_exported_chunk_rows()
    for row in tqdm(rows, total=total_chunk_count, desc="Staging oversized chunks", unit="chunk"):
        gene_id, dataset_id = row[0], row[1]
        chunk_index, chunk_count, source_variant_count = map(int, row[2:5])
        key = (gene_id, dataset_id)
        if key not in expected_variants:
            raise ValueError(f"Unexpected oversized variant chunk for {gene_id} {dataset_id}")

        expected_variant_count = expected_variants[key]
        expected_chunk_count = (expected_variant_count + VARIANT_CHUNK_SIZE - 1) // VARIANT_CHUNK_SIZE
        if source_variant_count != expected_variant_count or chunk_count != expected_chunk_count:
            raise ValueError(f"Inconsistent oversized variant chunk metadata for {gene_id} {dataset_id}")
        if chunk_index in observed_chunk_indices[key]:
            raise ValueError(f"Duplicate oversized variant chunk {chunk_index} for {gene_id} {dataset_id}")

        observed_chunk_indices[key].add(chunk_index)
        chunk_directory = os.path.join(staging_directory, gene_id, dataset_id)
        os.makedirs(chunk_directory, exist_ok=True)
        chunk_path = os.path.join(chunk_directory, f"{chunk_index}.json")
        with open(chunk_path, mode="w", encoding="utf-8") as chunk_file:
            chunk_file.write(row[5])
        staged_chunks[key].append((chunk_index, chunk_path))

    return staged_chunks


def write_oversized_variants(output_directory, oversized_genes, dataset_ids, staged_chunks):
    report_genes = []

    for gene in tqdm(oversized_genes, desc="Assembling oversized genes", unit="gene"):
        gene_id = gene["gene_id"]
        num = int(gene_id.lstrip("ENSGR"))
        gene_directory = f"{output_directory}/genes/{str(num % 1000).zfill(3)}"
        dataset_reports = []

        for dataset_id in dataset_ids:
            source_variant_count = gene["variant_counts"][dataset_id]
            expected_chunk_count = (source_variant_count + VARIANT_CHUNK_SIZE - 1) // VARIANT_CHUNK_SIZE
            output_path = f"{gene_directory}/{gene_id}_{dataset_id.lower()}_variants.json"
            chunks = staged_chunks[(gene_id, dataset_id)]
            written_variant_count, byte_size = assemble_variant_chunks(
                output_path,
                chunks,
                expected_chunk_count,
                source_variant_count,
            )
            dataset_reports.append(
                {
                    "dataset": dataset_id,
                    "source_variant_count": source_variant_count,
                    "expected_chunks": expected_chunk_count,
                    "observed_chunks": len(chunks),
                    "written_variants": written_variant_count,
                    "final_path": output_path,
                    "byte_size": byte_size,
                }
            )

        report_genes.append(
            {
                "gene_id": gene_id,
                "symbol": gene["symbol"],
                "gene_document_paths": gene["gene_document_paths"],
                "datasets": dataset_reports,
            }
        )

    report_path = f"{output_directory}/oversized_genes_report.json"
    with open(report_path, mode="w", encoding="utf-8") as report_file:
        json.dump({"genes": report_genes}, report_file, indent=2)
        report_file.write("\n")


def write_data_files(table_path, output_directory, genes=None):
    if output_directory.startswith("gs://"):
        raise ValueError("Google Storage paths are not supported for output_directory")

    print(f"\n\n === Reading combined hail table from {table_path}", flush=True)
    ds = hl.read_table(table_path)

    if genes is not None:
        if not genes:
            raise ValueError("genes must contain at least one gene ID")
        ds = ds.filter(hl.literal(set(genes)).contains(ds.gene_id))
        missing_genes = sorted(set(genes) - set(ds.gene_id.collect()))
        if missing_genes:
            raise ValueError(f"Unknown gene IDs: {', '.join(missing_genes)}")

    print("\n\n === Checking gene variant counts", flush=True)

    counts_expr = {}
    for name in EXPECTED_DATASETS:
        if name in ds.variants:
            counts_expr[name] = hl.or_else(hl.len(ds.variants[name]), 0)
        else:
            counts_expr[name] = 0

    ds = ds.annotate(variant_counts=hl.struct(**counts_expr))

    ds = ds.annotate(
        total_variants=(
            ds.variant_counts.ASC
            + ds.variant_counts.ASC2
            + ds.variant_counts.BipEx
            + ds.variant_counts.Epi25
            + ds.variant_counts.GP2
            + ds.variant_counts.IBD
            + ds.variant_counts.SCHEMA
            + ds.variant_counts.ClinVarGRCh38
        )
    )

    ds_large_genes = ds.filter(ds.total_variants > VARIANT_THRESHOLD)
    dataset_ids = list(ds.variants.dtype.fields)
    large_gene_rows = ds_large_genes.select("symbol", "variant_counts").collect()
    oversized_genes = [
        {
            "gene_id": row.gene_id,
            "symbol": row.symbol,
            "variant_counts": {dataset_id: row.variant_counts[dataset_id] for dataset_id in dataset_ids},
        }
        for row in large_gene_rows
    ]

    print(f"Routing {len(oversized_genes)} genes with > {VARIANT_THRESHOLD:,} variants through chunked export:")
    for gene in oversized_genes:
        print(f" - {gene['symbol']} ({gene['gene_id']})")

    if oversized_genes:
        print("\n\n === Exporting oversized gene documents", flush=True)
        written_documents = write_oversized_gene_documents(output_directory, ds_large_genes, len(oversized_genes))
        for gene in oversized_genes:
            gene["gene_document_paths"] = written_documents[gene["gene_id"]]

        print("\n\n === Exporting oversized variant chunks", flush=True)
        chunk_parts_directory = export_oversized_variant_chunks(
            output_directory,
            ds_large_genes,
            dataset_ids,
            oversized_genes,
        )
        chunk_staging_directory = f"{output_directory}/temp_oversized_variant_chunks"
        expected_variants = {
            (gene["gene_id"], dataset_id): gene["variant_counts"][dataset_id]
            for gene in oversized_genes
            for dataset_id in dataset_ids
        }
        staged_chunks = stage_oversized_variant_chunks(
            chunk_parts_directory,
            chunk_staging_directory,
            expected_variants,
        )

        print("\n\n === Assembling oversized variant files", flush=True)
        write_oversized_variants(output_directory, oversized_genes, dataset_ids, staged_chunks)
        shutil.rmtree(chunk_parts_directory)
        shutil.rmtree(chunk_staging_directory)
    else:
        with open(f"{output_directory}/oversized_genes_report.json", mode="w", encoding="utf-8") as report_file:
            json.dump({"genes": []}, report_file, indent=2)
            report_file.write("\n")

    print("\n\n === Writing metadata, gene search terms, and result summaries", flush=True)
    write_gene_summary_file(output_directory, ds)

    ds_filtered = ds.filter(ds.total_variants <= VARIANT_THRESHOLD)
    ds_filtered = ds_filtered.drop("variant_counts", "total_variants")
    temp_dir_name = "temp_parts"
    n_rows = ds_filtered.count()
    ds_filtered = ds_filtered.repartition(500)

    print(f"\n\n === Exporting {n_rows} ordinary gene rows to {output_directory}/{temp_dir_name}", flush=True)
    ds_filtered.select(data=hl.json(ds_filtered.row)).export(
        f"{output_directory}/{temp_dir_name}",
        header=False,
        parallel="separate_header",
    )

    print("\n\n === Writing ordinary per-gene JSON files", flush=True)
    write_json_files(output_directory, temp_dir_name, n_rows)
    print("Finished writing per-gene JSON files", flush=True)


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
