resource "aws_wafv2_web_acl" "api_regional" {
  name  = "${local.name_prefix}-api-origin-verify"
  scope = "REGIONAL"

  default_action {
    block {}
  }

  rule {
    name     = "allow-cloudfront-origin-verify"
    priority = 1

    action {
      allow {}
    }

    statement {
      byte_match_statement {
        field_to_match {
          single_header {
            name = lower(var.origin_verify_header_name)
          }
        }

        positional_constraint = "EXACTLY"
        search_string         = random_password.origin_verify.result
        text_transformation {
          priority = 0
          type     = "NONE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-api-origin-verify-allow"
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
        metric_name                = "${local.name_prefix}-api-managed-common"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-api-regional-waf"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

resource "aws_wafv2_web_acl_association" "api_gateway" {
  resource_arn = local.api_stage_arn
  web_acl_arn  = aws_wafv2_web_acl.api_regional.arn
}
