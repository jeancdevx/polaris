resource "aws_wafv2_web_acl" "cloudfront" {
  provider = aws.us_east_1

  name  = "${local.name_prefix}-cloudfront"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "rate-limit-per-ip"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit_per_ip
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-cf-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  dynamic "rule" {
    for_each = var.enable_managed_waf_rules ? [1] : []

    content {
      name     = "aws-managed-common"
      priority = 10

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesCommonRuleSet"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name_prefix}-cf-managed-common"
        sampled_requests_enabled   = true
      }
    }
  }

  dynamic "rule" {
    for_each = var.enable_managed_waf_rules ? [1] : []

    content {
      name     = "aws-managed-known-bad-inputs"
      priority = 20

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesKnownBadInputsRuleSet"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name_prefix}-cf-known-bad-inputs"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-cloudfront-waf"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}
