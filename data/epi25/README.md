# Epi25

1. Start a cluster.

   ```shell
   hailctl dataproc start epi25-data \
      --max-idle 30m \
      --packages "elasticsearch~=5.5"
   ```

2. Prepare gene results.

   ```shell
   hailctl dataproc submit epi25-data \
      --pyfiles ./data/data_utils \
      ./data/epi25/prepare_gene_results.py \
         --input-url=gs://epi-browser/2018-11-07_epi25-exome-browser-gene-results-table-reduced.csv \
         --output-url=gs://epi-browser/2018-11-07_gene_results.ht
   ```

3. Prepare variant results.

   ```shell
   hailctl dataproc submit epi25-data \
      --pyfiles ./data/data_utils \
      ./data/epi25/prepare_variant_results.py \
         gs://epi-browser/2018-11-27_variant_results.ht
   ```

4. Load tables into Elasticsearch. Replace `$ELASTICSEARCH_IP` with the IP address of your Elasticsearch server.

   ```shell
   hailctl dataproc submit epi25-data
      --pyfiles ./data/data_utils \
      ./data/export_hail_table_to_elasticsearch.py \
         gs://epi-browser/2018-11-07_gene_results.ht \
         $ELASTICSEARCH_IP \
         epi25_gene_results_2018_11_07 \
         --num-shards=2

   hailctl dataproc submit epi25-data
      --pyfiles ./data/data_utils \
      ./data/export_hail_table_to_elasticsearch.py \
         gs://epi-browser/2018-11-27_variant_results.ht \
         $ELASTICSEARCH_IP \
         epi25_variant_results_2018_11_27 \
         --num-shards=2
   ```

5. Stop cluster.

   ```shell
   hailctl dataproc stop epi25-data
   ```
