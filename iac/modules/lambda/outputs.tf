output "function_arns" {
  description = "Map of function ARNs"
  value = {
    for k, v in aws_lambda_function.functions : k => v.arn
  }
}

output "function_names" {
  description = "Map of function names"
  value = {
    for k, v in aws_lambda_function.functions : k => v.function_name
  }
}

output "function_invoke_arns" {
  description = "Map of function invoke ARNs"
  value = {
    for k, v in aws_lambda_function.functions : k => v.invoke_arn
  }
}
