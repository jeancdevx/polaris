resource "aws_lambda_function" "kafka_topic_creator" {
  function_name    = "${local.name}-kafka-topic-creator"
  filename         = data.archive_file.kafka_topic_creator.output_path
  source_code_hash = data.archive_file.kafka_topic_creator.output_base64sha256
  handler          = "index.handler"
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 256

  role = aws_iam_role.kafka_topic_creator.arn

  environment {
    variables = {
      KAFKA_BOOTSTRAP_SERVERS  = aws_msk_cluster.main.bootstrap_brokers_sasl_iam
      TOPIC_PARTITIONS         = "3"
      TOPIC_REPLICATION_FACTOR = "3"
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.security_group_id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-kafka-topic-creator"
  })

  depends_on = [aws_msk_cluster.main]
}
