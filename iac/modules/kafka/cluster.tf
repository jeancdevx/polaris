resource "aws_msk_cluster" "main" {
  cluster_name           = local.cluster_name
  kafka_version          = var.kafka_version
  number_of_broker_nodes = local.broker_count

  enhanced_monitoring = local.enhanced_monitoring

  broker_node_group_info {
    instance_type   = local.broker_instance_type
    client_subnets  = slice(var.subnet_ids, 0, local.broker_count)
    security_groups = var.security_group_ids

    storage_info {
      ebs_storage_info {
        volume_size = local.broker_volume_size_gb
      }
    }

    connectivity_info {
      public_access {
        type = "DISABLED"
      }
    }
  }

  client_authentication {
    sasl {
      iam = true
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }

    encryption_at_rest_kms_key_arn = var.kms_key_arn != "" ? var.kms_key_arn : null
  }

  configuration_info {
    arn      = aws_msk_configuration.main.arn
    revision = aws_msk_configuration.main.latest_revision
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.broker.name
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = local.cluster_name
  })
}
