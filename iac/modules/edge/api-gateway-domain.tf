resource "aws_apigatewayv2_domain_name" "api" {
  domain_name = local.api_fqdn

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.regional.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = merge(local.common_tags, {
    Name = local.api_fqdn
  })
}

resource "aws_apigatewayv2_api_mapping" "api" {
  api_id      = var.api_gateway_id
  domain_name = aws_apigatewayv2_domain_name.api.id
  stage       = "$default"
}
