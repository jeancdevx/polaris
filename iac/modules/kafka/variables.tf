variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where MSK will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for MSK brokers (min 2 AZs)"
  type        = list(string)
}

variable "kafka_version" {
  description = "Apache Kafka version"
  type        = string
  default     = "3.6.0"
}

variable "number_of_broker_nodes" {
  description = "Number of Kafka broker nodes. Must be multiple of number of AZs."
  type        = number
  default     = 3
}

variable "broker_instance_type" {
  description = "EC2 instance type for Kafka brokers"
  type        = string
  default     = "kafka.t3.small"
}

variable "broker_ebs_volume_size" {
  description = "EBS volume size in GB for each broker"
  type        = number
  default     = 100
}

variable "broker_ebs_volume_type" {
  description = "EBS volume type for each broker"
  type        = string
  default     = "gp3"
}

variable "encryption_in_transit_client_broker" {
  description = "Encryption setting for data in transit between clients and brokers"
  type        = string
  default     = "TLS"

  validation {
    condition     = contains(["TLS", "TLS_PLAINTEXT", "PLAINTEXT"], var.encryption_in_transit_client_broker)
    error_message = "encryption_in_transit_client_broker must be TLS, TLS_PLAINTEXT, or PLAINTEXT."
  }
}

variable "encryption_in_transit_inter_broker" {
  description = "Encryption setting for data in transit between brokers"
  type        = string
  default     = "TLS"

  validation {
    condition     = contains(["TLS", "PLAINTEXT"], var.encryption_in_transit_inter_broker)
    error_message = "encryption_in_transit_inter_broker must be TLS or PLAINTEXT."
  }
}

variable "encryption_at_rest_kms_key_arn" {
  description = "KMS key ARN for encryption at rest. If empty, uses AWS managed key."
  type        = string
  default     = ""
}

variable "enable_cloudwatch_logs" {
  description = "Enable CloudWatch logging for MSK"
  type        = bool
  default     = true
}

variable "cloudwatch_log_group_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 30
}

variable "enhanced_monitoring" {
  description = "Enhanced monitoring level"
  type        = string
  default     = "PER_BROKER"

  validation {
    condition     = contains(["DEFAULT", "PER_BROKER", "PER_TOPIC_PER_BROKER", "PER_TOPIC_PER_PARTITION"], var.enhanced_monitoring)
    error_message = "enhanced_monitoring must be DEFAULT, PER_BROKER, PER_TOPIC_PER_BROKER, or PER_TOPIC_PER_PARTITION."
  }
}

variable "security_group_id" {
  description = "Security group ID for MSK cluster"
  type        = string
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
