resource "aws_appsync_datasource" "none" {
  api_id = aws_appsync_graphql_api.main.id
  name   = "None"
  type   = "NONE"
}
