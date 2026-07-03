resource "aws_route53_record" "api" {
  zone_id = var.hosted_zone_id
  name    = local.api_fqdn
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.api.domain_name
    zone_id                = aws_cloudfront_distribution.api.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api_ipv6" {
  zone_id = var.hosted_zone_id
  name    = local.api_fqdn
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.api.domain_name
    zone_id                = aws_cloudfront_distribution.api.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "admin" {
  zone_id = var.hosted_zone_id
  name    = local.admin_fqdn
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.web.domain_name
    zone_id                = aws_cloudfront_distribution.web.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "admin_ipv6" {
  zone_id = var.hosted_zone_id
  name    = local.admin_fqdn
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.web.domain_name
    zone_id                = aws_cloudfront_distribution.web.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "atlantis" {
  count = var.atlantis_alb_dns_name != "" ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = local.atlantis_fqdn
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.atlantis[0].domain_name
    zone_id                = aws_cloudfront_distribution.atlantis[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "atlantis_ipv6" {
  count = var.atlantis_alb_dns_name != "" ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = local.atlantis_fqdn
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.atlantis[0].domain_name
    zone_id                = aws_cloudfront_distribution.atlantis[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "admin_api" {
  count = var.enable_admin_api_edge ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = local.admin_api_fqdn
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.admin_api[0].domain_name
    zone_id                = aws_cloudfront_distribution.admin_api[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "admin_api_ipv6" {
  count = var.enable_admin_api_edge ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = local.admin_api_fqdn
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.admin_api[0].domain_name
    zone_id                = aws_cloudfront_distribution.admin_api[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "graphql" {
  count = var.appsync_api_id != "" ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = local.graphql_fqdn
  type    = "A"

  alias {
    name                   = aws_appsync_domain_name.graphql[0].appsync_domain_name
    zone_id                = aws_appsync_domain_name.graphql[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "auth" {
  count = var.cognito_user_pool_id != "" ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = local.auth_fqdn
  type    = "A"

  alias {
    name                   = aws_cognito_user_pool_domain.auth[0].cloudfront_distribution
    zone_id                = aws_cognito_user_pool_domain.auth[0].cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "auth_ipv6" {
  count = var.cognito_user_pool_id != "" ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = local.auth_fqdn
  type    = "AAAA"

  alias {
    name                   = aws_cognito_user_pool_domain.auth[0].cloudfront_distribution
    zone_id                = aws_cognito_user_pool_domain.auth[0].cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}
