data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_iot_endpoint" "data_ats" {
  endpoint_type = "iot:Data-ATS"
}
