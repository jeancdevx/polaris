resource "aws_lambda_invocation" "kafka_topic_creator" {
  function_name = aws_lambda_function.kafka_topic_creator.function_name

  input = jsonencode({})

  triggers = {
    redeployment = sha1(jsonencode([
      aws_lambda_function.kafka_topic_creator.environment,
      aws_lambda_function.kafka_topic_creator.vpc_config,
    ]))
  }

  lifecycle {
    ignore_changes = [input]
  }
}
