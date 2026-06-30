resource "aws_iot_topic_rule" "rfid_validator" {
  for_each = var.rfid_rules

  name        = replace("${local.name_prefix}_${each.key}", "-", "_")
  description = each.value.description
  enabled     = true
  sql         = "SELECT * FROM '${each.value.topic}'"
  sql_version = "2016-03-23"

  lambda {
    function_arn = var.rfid_validator_function_arn
  }
}

resource "aws_lambda_permission" "rfid_validator" {
  for_each = var.rfid_rules

  statement_id  = "AllowExecutionFromIoT-${replace(each.key, "_", "-")}"
  action        = "lambda:InvokeFunction"
  function_name = var.rfid_validator_function_name
  principal     = "iot.amazonaws.com"
  source_arn    = aws_iot_topic_rule.rfid_validator[each.key].arn
}
