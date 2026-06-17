resource "aws_msk_cluster" "main" {
  cluster_name           = local.name
  kafka_version          = var.kafka_version
  number_of_broker_nodes = var.number_of_broker_nodes
  enhanced_monitoring    = var.enhanced_monitoring

  broker_node_group_info {
    instance_type   = var.broker_instance_type
    client_subnets  = var.private_subnet_ids
    security_groups = [var.security_group_id]

    storage_info {
      ebs_storage_info {
        volume_size = var.broker_ebs_volume_size
      }
    }
  }

  client_authentication {
    sasl {
      iam   = true
      scram = false
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = var.encryption_in_transit_client_broker
      in_cluster    = var.encryption_in_transit_inter_broker == "TLS" ? true : false
    }

    encryption_at_rest_kms_key_arn = var.encryption_at_rest_kms_key_arn != "" ? var.encryption_at_rest_kms_key_arn : null
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = var.enable_cloudwatch_logs
        log_group = var.enable_cloudwatch_logs ? aws_cloudwatch_log_group.msk[0].name : null
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = local.name
  })
}
