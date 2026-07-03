variable "aws_region" {
  description = "Regional AWS region for API Gateway, ACM (regional), and regional WAF"
  type        = string
}

variable "base_domain" {
  description = "Registered apex domain in Route 53 (e.g. galaxymorph.com)"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for base_domain"
  type        = string
}

variable "environment" {
  description = "Environment name (staging, prod)"
  type        = string

  validation {
    condition     = contains(["staging", "prod"], var.environment)
    error_message = "edge module is only used for staging and prod."
  }
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "polaris"
}

variable "tags" {
  description = "Additional tags applied to edge resources"
  type        = map(string)
  default     = {}
}

variable "api_gateway_id" {
  description = "Public HTTP API Gateway ID (mobile and public routes)"
  type        = string
}

variable "admin_api_gateway_id" {
  description = "Admin HTTP API Gateway ID (separate API for /admin and /internal routes)"
  type        = string
}

variable "admin_api_gateway_stage_name" {
  description = "Admin HTTP API Gateway stage name"
  type        = string
  default     = "$default"
}

variable "api_gateway_stage_name" {
  description = "Public HTTP API Gateway stage name"
  type        = string
  default     = "$default"
}

variable "api_domain_name" {
  description = "Override FQDN for the public API (default: api.galaxymorph.com or staging-api.galaxymorph.com)"
  type        = string
  default     = null
}

variable "admin_domain_name" {
  description = "Override FQDN for web-admin CloudFront"
  type        = string
  default     = null
}

variable "atlantis_domain_name" {
  description = "Override FQDN for Atlantis CloudFront"
  type        = string
  default     = null
}

variable "admin_api_domain_name" {
  description = "Override FQDN for admin HTTP API via CloudFront (default: admin-api.galaxymorph.com or staging-admin-api.galaxymorph.com)"
  type        = string
  default     = null
}

variable "graphql_domain_name" {
  description = "Override FQDN for AppSync GraphQL custom domain (optional)"
  type        = string
  default     = null
}

variable "auth_domain_name" {
  description = "Override FQDN for Cognito hosted UI custom domain (default: auth.galaxymorph.com or staging-auth.galaxymorph.com)"
  type        = string
  default     = null
}

variable "assets_bucket_https_policy_json" {
  description = "Base HTTPS-only bucket policy JSON from the s3 module"
  type        = string
}

variable "assets_bucket_name" {
  description = "S3 bucket hosting static web-admin assets"
  type        = string
}

variable "web_origin_path" {
  description = "S3 prefix for web-admin static files"
  type        = string
  default     = "web-admin"
}

variable "atlantis_alb_dns_name" {
  description = "Atlantis ALB DNS name. Empty skips Atlantis CloudFront distribution."
  type        = string
  default     = ""
}

variable "enable_appsync_custom_domain" {
  description = "Create AppSync custom domain on graphql.* (requires appsync_api_id)"
  type        = bool
  default     = true
}

variable "enable_cognito_custom_domain" {
  description = "Create Cognito hosted UI custom domain on auth.* (requires cognito_user_pool_id)"
  type        = bool
  default     = true
}

variable "enable_atlantis_cloudfront" {
  description = "Expose Atlantis via atlantis.* CloudFront distribution (requires atlantis_alb_dns_name after Atlantis is deployed)"
  type        = bool
  default     = false
}

variable "appsync_api_id" {
  description = "AppSync GraphQL API ID for custom domain on graphql.*"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito user pool ID for custom auth.* hosted UI domain"
  type        = string
}

variable "enable_admin_api_edge" {
  description = "Expose admin API via admin-api.* CloudFront → admin HTTP API Gateway (module api-gateway-private)"
  type        = bool
  default     = true
}

variable "origin_verify_header_name" {
  description = "Custom header CloudFront sends to API Gateway; regional WAF requires an exact match"
  type        = string
  default     = "X-Origin-Verify"
}

variable "waf_rate_limit_per_ip" {
  description = "CloudFront WAF rate limit per IP (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "enable_managed_waf_rules" {
  description = "Attach AWS managed rule groups to CloudFront and regional API WAF ACLs"
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "CloudFront price class for all distributions"
  type        = string
  default     = "PriceClass_100"
}
