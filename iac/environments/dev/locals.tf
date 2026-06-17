locals {
  default_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  lambda_functions = {
    rfid_validator = {
      function_name    = "rfid-validator"
      runtime          = "nodejs24.x"
      handler          = "index.handler"
      source_dir       = "../../services/lambdas/rfid-validator/dist"
      vpc_enabled      = true
      kafka_enabled    = true
      dynamodb_enabled = true
    }
    audit_logger = {
      function_name  = "audit-logger"
      runtime        = "nodejs24.x"
      handler        = "index.handler"
      source_dir     = "../../services/lambdas/audit-logger/dist"
      vpc_enabled    = true
      s3_enabled     = true
      s3_bucket_arns = []
    }
    notification_sender = {
      function_name    = "notification-sender"
      runtime          = "nodejs24.x"
      handler          = "index.handler"
      source_dir       = "../../services/lambdas/notification-sender/dist"
      vpc_enabled      = true
      dynamodb_enabled = true
      sns_enabled      = true
      sns_topic_arns   = []
    }
    reservation_cleanup = {
      function_name    = "reservation-cleanup"
      runtime          = "nodejs24.x"
      handler          = "index.handler"
      source_dir       = "../../services/lambdas/reservation-cleanup/dist"
      vpc_enabled      = true
      kafka_enabled    = true
      dynamodb_enabled = true
    }
    sensor_data_processor = {
      function_name    = "sensor-data-processor"
      runtime          = "nodejs24.x"
      handler          = "index.handler"
      source_dir       = "../../services/lambdas/sensor-data-processor/dist"
      vpc_enabled      = true
      dynamodb_enabled = true
    }
    occupancy_aggregator = {
      function_name = "occupancy-aggregator"
      runtime       = "nodejs24.x"
      handler       = "index.handler"
      source_dir    = "../../services/lambdas/occupancy-aggregator/dist"
      vpc_enabled   = true
    }
    daily_report_generator = {
      function_name  = "daily-report-generator"
      runtime        = "nodejs24.x"
      handler        = "index.handler"
      source_dir     = "../../services/lambdas/daily-report-generator/dist"
      vpc_enabled    = true
      s3_enabled     = true
      s3_bucket_arns = []
    }
    health_checker = {
      function_name  = "health-checker"
      runtime        = "nodejs24.x"
      handler        = "index.handler"
      source_dir     = "../../services/lambdas/health-checker/dist"
      vpc_enabled    = true
      sns_enabled    = true
      sns_topic_arns = []
    }
  }

  lambda_iam_functions = {
    for k, v in local.lambda_functions : k => {
      function_name    = v.function_name
      vpc_enabled      = v.vpc_enabled
      kafka_enabled    = lookup(v, "kafka_enabled", false)
      dynamodb_enabled = lookup(v, "dynamodb_enabled", false)
      s3_enabled       = lookup(v, "s3_enabled", false)
      s3_bucket_arns   = lookup(v, "s3_bucket_arns", [])
      sns_enabled      = lookup(v, "sns_enabled", false)
      sns_topic_arns   = lookup(v, "sns_topic_arns", [])
      secrets          = lookup(v, "secrets", {})
    }
  }

  lambda_sg_functions = {
    for k, v in local.lambda_functions : k => {
      function_name = v.function_name
      vpc_enabled   = v.vpc_enabled
    }
  }
}
