locals {
  name_prefix = "${var.project_name}-${var.environment}"

  name_segment = var.environment == "prod" ? "" : "${var.environment}-"

  api_fqdn = coalesce(
    var.api_domain_name,
    "${local.name_segment}api.${var.base_domain}"
  )

  admin_fqdn = coalesce(
    var.admin_domain_name,
    "${local.name_segment}admin.${var.base_domain}"
  )

  atlantis_fqdn = coalesce(
    var.atlantis_domain_name,
    "${local.name_segment}atlantis.${var.base_domain}"
  )

  admin_api_fqdn = coalesce(
    var.admin_api_domain_name,
    "${local.name_segment}admin-api.${var.base_domain}"
  )

  graphql_fqdn = coalesce(
    var.graphql_domain_name,
    "${local.name_segment}graphql.${var.base_domain}"
  )

  auth_fqdn = coalesce(
    var.auth_domain_name,
    "${local.name_segment}auth.${var.base_domain}"
  )

  cloudfront_aliases = compact([
    local.api_fqdn,
    local.admin_fqdn,
    var.enable_admin_api_edge ? local.admin_api_fqdn : "",
    var.enable_atlantis_cloudfront ? local.atlantis_fqdn : "",
  ])

  acm_sans = distinct(compact([
    "*.${var.base_domain}",
    local.api_fqdn,
    local.admin_fqdn,
    local.admin_api_fqdn,
    local.atlantis_fqdn,
    var.enable_appsync_custom_domain ? local.graphql_fqdn : "",
    var.enable_cognito_custom_domain ? local.auth_fqdn : "",
  ]))

  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "edge"
    }
  )
}
