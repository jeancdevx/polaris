resource "aws_ecr_repository" "service" {
  name                 = "${local.name_prefix}-${var.service_name}"
  image_tag_mutability = var.image_tag_mutability
  force_delete         = var.environment == "dev"

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-${var.service_name}"
    Service = var.service_name
  })
}

resource "aws_ecr_lifecycle_policy" "service" {
  repository = aws_ecr_repository.service.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
