resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = var.password_minimum_length
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  mfa_configuration = local.mfa_configuration

  dynamic "software_token_mfa_configuration" {
    for_each = local.mfa_enabled ? [1] : []

    content {
      enabled = true
    }
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  admin_create_user_config {
    allow_admin_create_user_only = var.admin_create_user_only
  }

  deletion_protection = local.deletion_protection ? "ACTIVE" : "INACTIVE"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-users"
  })
}
