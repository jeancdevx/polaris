resource "aws_cloudformation_stack" "rds_secret_rotation" {
  count = local.enable_rds_rotation ? 1 : 0

  name = "${local.name_prefix}-rds-secret-rotation"

  capabilities = [
    "CAPABILITY_IAM",
    "CAPABILITY_AUTO_EXPAND",
  ]

  template_body = jsonencode({
    AWSTemplateFormatVersion = "2010-09-09"
    Transform                = "AWS::SecretsManager-2024-09-16"
    Description              = "Automatic rotation for Aurora PostgreSQL master user secret"

    Resources = {
      SecretRotationSchedule = {
        Type = "AWS::SecretsManager::RotationSchedule"
        Properties = {
          SecretId = var.rds_master_secret_arn
          HostedRotationLambda = {
            RotationType        = "PostgreSQLSingleUser"
            RotationLambdaName  = local.rds_rotation_lambda_name
            VpcSecurityGroupIds = join(",", var.security_group_ids)
            VpcSubnetIds        = join(",", var.subnet_ids)
          }
          RotationRules = {
            AutomaticallyAfterDays = local.rds_rotation_days
          }
          RotateImmediatelyOnUpdate = local.rotate_immediately
        }
      }
    }

    Outputs = {
      RotationScheduleId = {
        Value = {
          Ref = "SecretRotationSchedule"
        }
      }
    }
  })

  tags = local.common_tags
}
