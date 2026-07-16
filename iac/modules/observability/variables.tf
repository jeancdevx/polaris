variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "tags" {
  description = "Additional tags applied to observability resources"
  type        = map(string)
  default     = {}
}

variable "sns_alerts_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name for service CPU/memory alarms"
  type        = string
}

variable "ecs_service_names" {
  description = "ECS service names to monitor with CPU alarms"
  type        = list(string)
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix (app/name/id) for ApplicationELB metrics"
  type        = string
}

variable "enable_alb_alarms" {
  description = "Create CloudWatch alarms for the ALB and target groups"
  type        = bool
  default     = true
}

variable "enable_api_gateway_alarms" {
  description = "Create CloudWatch alarms for the public HTTP API Gateway"
  type        = bool
  default     = true
}

variable "enable_appsync_alarms" {
  description = "Create CloudWatch alarms for AppSync"
  type        = bool
  default     = true
}

variable "enable_rds_alarms" {
  description = "Create CloudWatch alarms for Aurora"
  type        = bool
  default     = true
}

variable "alb_target_group_arn_suffixes" {
  description = "ALB target group ARN suffixes keyed by service name"
  type        = map(string)
  default     = {}
}

variable "api_gateway_public_api_id" {
  description = "Public HTTP API Gateway ID for 5XX alarms"
  type        = string
  default     = ""
}

variable "api_gateway_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "$default"
}

variable "appsync_api_id" {
  description = "AppSync GraphQL API ID for error alarms"
  type        = string
  default     = ""
}

variable "rds_cluster_identifier" {
  description = "Aurora cluster identifier for RDS alarms"
  type        = string
  default     = ""
}

variable "event_processor_log_group_name" {
  description = "Event processor CloudWatch log group used for functional failure alarms"
  type        = string
  default     = ""
}

variable "kafka_broker_count" {
  description = "Number of MSK brokers to monitor"
  type        = number
  default     = 0
}

variable "kafka_cluster_name" {
  description = "MSK cluster name for broker and consumer lag alarms"
  type        = string
  default     = ""
}

variable "kafka_consumer_group" {
  description = "Kafka consumer group monitored for processing lag"
  type        = string
  default     = "event-processor-service"
}

variable "kafka_topics" {
  description = "Kafka topics monitored for consumer lag"
  type        = set(string)
  default = [
    "audit.events",
    "reservation.cancelled",
    "reservation.created",
    "rfid.validation",
    "sensor.occupancy",
    "sensor.proximity",
    "vehicle.entry",
    "vehicle.exit",
  ]
}

variable "redis_cache_cluster_ids" {
  description = "Provisioned ElastiCache cluster IDs for node-level alarms"
  type        = set(string)
  default     = []
}

variable "redis_serverless_cache_name" {
  description = "Serverless ElastiCache name for capacity alarms"
  type        = string
  default     = ""
}

variable "lambda_function_names" {
  description = "Lambda function names for error alarms"
  type        = list(string)
  default     = []
}

variable "sqs_dlq_queue_names" {
  description = "SQS DLQ queue names for backlog alarms"
  type        = list(string)
  default     = []
}

variable "ecs_cpu_threshold" {
  description = "ECS CPU utilization alarm threshold (percent)"
  type        = number
  default     = 80
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization alarm threshold (percent)"
  type        = number
  default     = 80
}

variable "kafka_consumer_lag_threshold" {
  description = "Maximum consumer group offset lag before alarming"
  type        = number
  default     = 1000
}

variable "rds_connections_threshold" {
  description = "Aurora database connection count before alarming"
  type        = number
  default     = 500
}

variable "redis_memory_threshold" {
  description = "Provisioned Redis database memory usage threshold (percent)"
  type        = number
  default     = 80
}

variable "redis_serverless_data_storage_threshold_bytes" {
  description = "Serverless Redis bytes used before alarming; zero disables the alarm"
  type        = number
  default     = 0
}

variable "api_5xx_threshold" {
  description = "API Gateway 5XX count threshold per evaluation period"
  type        = number
  default     = 5
}

variable "alarm_period_seconds" {
  description = "CloudWatch alarm evaluation period in seconds"
  type        = number
  default     = 300
}

variable "alarm_evaluation_periods" {
  description = "Number of periods before alarming"
  type        = number
  default     = 2
}

variable "enable_dashboards" {
  description = "Create CloudWatch dashboards"
  type        = bool
  default     = true
}

variable "alarm_email_endpoints" {
  description = "Optional email addresses subscribed to the alerts SNS topic"
  type        = list(string)
  default     = []
}
