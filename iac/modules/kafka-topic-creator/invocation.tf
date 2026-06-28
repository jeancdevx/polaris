resource "aws_lambda_invocation" "create_topics" {
  count = var.invoke_on_deploy ? 1 : 0

  function_name = aws_lambda_function.main.function_name

  input = jsonencode({
    trigger = local.invocation_trigger
  })

  depends_on = [aws_lambda_function.main]

  lifecycle {
    replace_triggered_by = [
      aws_lambda_function.main
    ]
  }
}
