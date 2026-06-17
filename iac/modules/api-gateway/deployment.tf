# Deployment
resource "aws_api_gateway_deployment" "public" {
  rest_api_id = aws_api_gateway_rest_api.public.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_resource.auth_proxy.id,
      aws_api_gateway_resource.parking.id,
      aws_api_gateway_resource.parking_proxy.id,
      aws_api_gateway_resource.user.id,
      aws_api_gateway_resource.user_proxy.id,
      aws_api_gateway_resource.health.id,
      aws_api_gateway_integration.auth_proxy.id,
      aws_api_gateway_integration.parking_proxy.id,
      aws_api_gateway_integration.user_proxy.id,
      aws_api_gateway_integration.health.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_deployment" "private" {
  rest_api_id = aws_api_gateway_rest_api.private.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.internal.id,
      aws_api_gateway_resource.internal_proxy.id,
      aws_api_gateway_resource.admin.id,
      aws_api_gateway_resource.admin_proxy.id,
      aws_api_gateway_resource.health_private.id,
      aws_api_gateway_integration.internal_proxy.id,
      aws_api_gateway_integration.admin_proxy.id,
      aws_api_gateway_integration.health_private.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}
