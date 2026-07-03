provider "aws" {
  region = var.aws_region
  # Vacío en CI/Atlantis (cadena de credenciales por defecto); perfil SSO solo en local.
  profile = var.aws_profile != "" ? var.aws_profile : null

  default_tags {
    tags = local.common_tags
  }
}
