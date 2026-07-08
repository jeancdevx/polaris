resource "aws_acm_certificate" "regional" {
  count = local.edge_full ? 1 : 0

  domain_name               = local.api_fqdn
  subject_alternative_names = local.acm_sans
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-acm-regional"
  })
}

resource "aws_acm_certificate" "cloudfront" {
  count = local.edge_full ? 1 : 0

  provider = aws.us_east_1

  domain_name               = local.api_fqdn
  subject_alternative_names = local.acm_sans
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-acm-cloudfront"
  })
}

resource "aws_route53_record" "cert_validation_regional" {
  for_each = local.edge_full ? {
    for option in aws_acm_certificate.regional[0].domain_validation_options : option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  } : {}

  zone_id         = var.hosted_zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_route53_record" "cert_validation_cloudfront" {
  for_each = local.edge_full ? {
    for option in aws_acm_certificate.cloudfront[0].domain_validation_options : option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  } : {}

  zone_id         = var.hosted_zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "regional" {
  count = local.edge_full ? 1 : 0

  certificate_arn         = aws_acm_certificate.regional[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation_regional : record.fqdn]
}

resource "aws_acm_certificate_validation" "cloudfront" {
  count = local.edge_full ? 1 : 0

  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.cloudfront[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation_cloudfront : record.fqdn]
}
