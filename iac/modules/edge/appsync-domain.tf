resource "aws_appsync_domain_name" "graphql" {
  count = var.enable_appsync_custom_domain ? 1 : 0

  domain_name     = local.graphql_fqdn
  certificate_arn = aws_acm_certificate_validation.regional.certificate_arn
}

resource "aws_appsync_domain_name_api_association" "graphql" {
  count = var.enable_appsync_custom_domain ? 1 : 0

  api_id      = var.appsync_api_id
  domain_name = aws_appsync_domain_name.graphql[0].domain_name
}
