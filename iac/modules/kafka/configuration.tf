resource "aws_msk_configuration" "main" {
  name              = "${local.name_prefix}-msk-config"
  kafka_versions    = [var.kafka_version]
  server_properties = local.server_properties

  description = "Polaris MSK cluster configuration"
}
