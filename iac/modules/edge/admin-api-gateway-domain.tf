resource "aws_apigatewayv2_domain_name" "admin_api" {
  count = var.enable_admin_api_edge ? 1 : 0

  domain_name = local.admin_api_fqdn

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.regional.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = merge(local.common_tags, {
    Name = local.admin_api_fqdn
  })
}

resource "aws_apigatewayv2_api_mapping" "admin_api" {
  count = var.enable_admin_api_edge ? 1 : 0

  api_id      = var.admin_api_gateway_id
  domain_name = aws_apigatewayv2_domain_name.admin_api[0].id
  stage       = var.admin_api_gateway_stage_name
}
