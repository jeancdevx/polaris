resource "aws_cloudwatch_dashboard" "system" {
  count = var.enable_dashboards ? 1 : 0

  dashboard_name = "${local.name_prefix}-system"

  dashboard_body = jsonencode({
    widgets = concat(
      [
        {
          type   = "text"
          x      = 0
          y      = 0
          width  = 24
          height = 1
          properties = {
            markdown = "# Polaris ${var.environment} — system overview"
          }
        }
      ],
      [
        for idx, service in var.ecs_service_names : {
          type   = "metric"
          x      = (idx % 2) * 12
          y      = 1 + floor(idx / 2) * 6
          width  = 12
          height = 6
          properties = {
            title  = "ECS CPU — ${service}"
            region = data.aws_region.current.region
            metrics = [
              [
                "AWS/ECS",
                "CPUUtilization",
                "ClusterName",
                var.ecs_cluster_name,
                "ServiceName",
                service,
                { stat = "Average", period = 300 }
              ],
              [
                ".",
                "MemoryUtilization",
                ".",
                ".",
                ".",
                ".",
                { stat = "Average", period = 300 }
              ]
            ]
            view = "timeSeries"
          }
        }
      ],
      var.alb_arn_suffix != "" ? [
        {
          type   = "metric"
          x      = 0
          y      = 1 + ceil(length(var.ecs_service_names) / 2) * 6
          width  = 12
          height = 6
          properties = {
            title  = "ALB target 5XX"
            region = data.aws_region.current.region
            metrics = [
              [
                "AWS/ApplicationELB",
                "HTTPCode_Target_5XX_Count",
                "LoadBalancer",
                var.alb_arn_suffix,
                { stat = "Sum", period = 300 }
              ]
            ]
            view = "timeSeries"
          }
        }
      ] : [],
      var.rds_cluster_identifier != "" ? [
        {
          type   = "metric"
          x      = 12
          y      = 1 + ceil(length(var.ecs_service_names) / 2) * 6
          width  = 12
          height = 6
          properties = {
            title  = "Aurora CPU"
            region = data.aws_region.current.region
            metrics = [
              [
                "AWS/RDS",
                "CPUUtilization",
                "DBClusterIdentifier",
                var.rds_cluster_identifier,
                { stat = "Average", period = 300 }
              ]
            ]
            view = "timeSeries"
          }
        }
      ] : []
    )
  })
}

data "aws_region" "current" {}
