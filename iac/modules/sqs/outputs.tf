output "queue_arns" {
  description = "SQS queue ARNs by logical key"
  value = {
    dlq_notification_sender = aws_sqs_queue.dlq_notification_sender.arn
    dlq_sensor_processing   = aws_sqs_queue.dlq_sensor_processing.arn
    reservation             = aws_sqs_queue.reservation.arn
  }
}

output "queue_names" {
  description = "SQS queue names by logical key"
  value = {
    dlq_notification_sender = aws_sqs_queue.dlq_notification_sender.name
    dlq_sensor_processing   = aws_sqs_queue.dlq_sensor_processing.name
    reservation             = aws_sqs_queue.reservation.name
  }
}

output "queue_urls" {
  description = "SQS queue URLs by logical key"
  value = {
    dlq_notification_sender = aws_sqs_queue.dlq_notification_sender.url
    dlq_sensor_processing   = aws_sqs_queue.dlq_sensor_processing.url
    reservation             = aws_sqs_queue.reservation.url
  }
}
