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

variable "alb_target_group_arn_suffixes" {
  description = "ALB target group ARN suffixes for unhealthy host alarms"
  type        = list(string)
  default     = []
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
