resource "aws_security_group" "msk" {
  name_prefix = "${local.name}-msk-"
  vpc_id      = var.vpc_id

  ingress {
    description = "Kafka from VPC"
    from_port   = 9092
    to_port     = 9098
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "Kafka JMX from VPC"
    from_port   = 11001
    to_port     = 11001
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-msk-sg"
  })
}

resource "aws_vpc_security_group_ingress_rule" "msk_from_kafka_ui" {
  security_group_id            = aws_security_group.msk.id
  referenced_security_group_id = var.kafka_ui_security_group_id
  from_port                    = 9098
  to_port                      = 9098
  ip_protocol                  = "tcp"
  description                  = "Allow Kafka UI to connect to MSK"
}
