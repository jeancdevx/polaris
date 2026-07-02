resource "aws_appsync_resolver" "availability" {
  api_id      = aws_appsync_graphql_api.main.id
  field       = "availability"
  type        = "Query"
  data_source = aws_appsync_datasource.availability.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "operation": "Invoke",
  "payload": {}
}
EOF

  response_template = "$util.toJson($context.result)"
}
