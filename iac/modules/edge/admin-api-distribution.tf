resource "aws_cloudfront_distribution" "admin_api" {
  count = var.enable_admin_api_edge ? 1 : 0

  enabled         = true
  is_ipv6_enabled = true
  comment         = "${local.name_prefix} admin API"
  price_class     = var.cloudfront_price_class
  aliases         = [local.admin_api_fqdn]
  web_acl_id      = aws_wafv2_web_acl.cloudfront.arn

  origin {
    domain_name = aws_apigatewayv2_domain_name.admin_api[0].domain_name_configuration[0].target_domain_name
    origin_id   = "admin-api-gateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = var.origin_verify_header_name
      value = random_password.origin_verify.result
    }
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "admin-api-gateway"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Accept", "Content-Type", "Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cloudfront.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-admin-api-cf"
  })
}
