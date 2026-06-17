data "archive_file" "kafka_topic_creator" {
  type        = "zip"
  source_dir  = "${path.module}/../../../services/lambdas/kafka-topic-creator/dist"
  output_path = "${path.module}/../../../.build/kafka-topic-creator.zip"
}
