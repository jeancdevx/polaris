locals {
  name_prefix = "${var.project_name}-${var.environment}"

  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.region

  msk_cluster_name = coalesce(var.msk_cluster_name, "${local.name_prefix}-kafka")

  msk_cluster_resource = var.msk_cluster_arn != "" ? var.msk_cluster_arn : "arn:aws:kafka:${local.region}:${local.account_id}:cluster/${local.msk_cluster_name}/*"

  msk_topic_resource = var.msk_cluster_arn != "" ? "${replace(var.msk_cluster_arn, ":cluster/", ":topic/")}/*" : "arn:aws:kafka:${local.region}:${local.account_id}:topic/${local.msk_cluster_name}/*/*"

  msk_group_resource = var.msk_cluster_arn != "" ? "${replace(var.msk_cluster_arn, ":cluster/", ":group/")}/*" : "arn:aws:kafka:${local.region}:${local.account_id}:group/${local.msk_cluster_name}/*/*"

  secrets_resource_arns = length(var.secrets_manager_secret_arns) > 0 ? var.secrets_manager_secret_arns : [
    "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${var.project_name}/${var.environment}/rds-*",
    "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${local.name_prefix}-rds-*",
    "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${local.name_prefix}-api-service-env-*",
    "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${local.name_prefix}-reservation-service-env-*"
  ]

  kms_decrypt_resource_arns = length(var.kms_key_arns) > 0 ? var.kms_key_arns : ["arn:aws:kms:${local.region}:${local.account_id}:key/*"]

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "iam"
    }
  )
}
