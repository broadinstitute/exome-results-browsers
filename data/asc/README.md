# ASC

1. Start a cluster.

   ```shell
   hailctl dataproc start asc-data \
      --max-idle 30m \
      --packages "elasticsearch~=5.5"
   ```

2. Prepare gene results.

   ```shell
   hailctl dataproc submit asc-data \
      ./data/asc/prepare_gene_results.py \
         gs://asc-browser/2019_04_14_gene_results.ht
   ```

3. Prepare variant results.

   ```shell
   hailctl dataproc submit asc-data \
      --pyfiles ./data/data_utils \
      ./data/asc/prepare_variant_results.py \
         gs://asc-browser/2019_04_16_variant_results.ht
   ```

4. Load tables into Elasticsearch. Replace `$ELASTICSEARCH_IP` with the IP address of your Elasticsearch server.

   ```shell
   hailctl dataproc submit asc-data
      --pyfiles ./data/data_utils \
      ./data/export_hail_table_to_elasticsearch.py \
         gs://asc-browser/2019_04_14_gene_results.ht \
         $ELASTICSEARCH_IP \
         asc_gene_results_2019_04_14 \
         --num-shards=2

   hailctl dataproc submit asc-data
      --pyfiles ./data/data_utils \
      ./data/export_hail_table_to_elasticsearch.py \
         gs://asc-browser/2019_04_16_variant_results.ht \
         $ELASTICSEARCH_IP \
         asc_variant_results_2019_04_16 \
         --num-shards=2
   ```

5. Stop cluster.

   ```shell
   hailctl dataproc stop asc-data
   ```
