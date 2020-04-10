# BipEx

1. Start a cluster.

   ```shell
   hailctl dataproc start bipex-data \
      --max-idle 30m \
      --packages "elasticsearch~=5.5"
   ```

2. Prepare gene results.

   ```shell
   hailctl dataproc submit bipex-data \
      --pyfiles ./data/data_utils \
      ./data/bipex/prepare_gene_results.py \
         gs://bipex-browser/gene_results.ht
   ```

3. Prepare variant results.

   ```shell
   hailctl dataproc submit bipex-data \
      --pyfiles ./data/data_utils \
      ./data/bipex/prepare_variant_results.py \
         gs://bipex-browser/variant_results.ht
   ```

4. Load tables into Elasticsearch. Replace `$ELASTICSEARCH_IP` with the IP address of your Elasticsearch server.

   ```shell
   hailctl dataproc submit bipex-data \
      --pyfiles ./data/data_utils \
      ./data/export_hail_table_to_elasticsearch.py \
         gs://bipex-browser/gene_results.ht \
         $ELASTICSEARCH_IP \
         bipex_gene_results \
         --num-shards=2

   hailctl dataproc submit bipex-data \
      --pyfiles ./data/data_utils \
      ./data/export_hail_table_to_elasticsearch.py \
         gs://bipex-browser/variant_results.ht \
         $ELASTICSEARCH_IP \
         bipex_variant_results \
         --num-shards=2
   ```

5. Stop cluster.

   ```shell
   hailctl dataproc stop bipex-data
   ```
