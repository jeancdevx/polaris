resource "aws_appsync_resolver" "publish_occupancy_changed" {
  api_id      = aws_appsync_graphql_api.main.id
  field       = "publishOccupancyChanged"
  type        = "Mutation"
  data_source = aws_appsync_datasource.none.name

  request_template = <<EOF
{
  "version": "2017-02-28",
  "payload": $util.toJson($context.arguments.input)
}
EOF

  response_template = "$util.toJson($context.result)"
}
