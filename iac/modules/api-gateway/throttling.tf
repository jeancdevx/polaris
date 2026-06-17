# Method Settings para throttling
resource "aws_api_gateway_method_settings" "public" {
  rest_api_id = aws_api_gateway_rest_api.public.id
  stage_name  = aws_api_gateway_stage.public.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    throttling_burst_limit = var.throttling_burst_limit
    throttling_rate_limit  = var.throttling_rate_limit
  }
}

resource "aws_api_gateway_method_settings" "private" {
  rest_api_id = aws_api_gateway_rest_api.private.id
  stage_name  = aws_api_gateway_stage.private.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    throttling_burst_limit = var.throttling_burst_limit * 2
    throttling_rate_limit  = var.throttling_rate_limit * 2
  }
}
