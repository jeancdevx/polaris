# atlantis

Servidor [Atlantis](https://www.runatlantis.io/) en ECS Fargate detrás de un ALB
público HTTPS. Ejecuta `terraform plan` en PRs; **no** aplica cambios
(`ATLANTIS_DISABLE_APPLY_ALL=true`).

## Requisitos previos

1. Certificado ACM en la misma región para `domain_name` (validación DNS).
2. Registro DNS `CNAME` de `domain_name` → output `alb_dns_name`.
3. PAT de GitHub con permisos `repo` para un usuario/bot (p. ej.
   `polaris-atlantis`).
4. Webhook en el repo apuntando a `webhook_url` con el `webhook_secret` del
   output.

## Permisos del task role

- `ReadOnlyAccess` (refresh de plan).
- RW en el bucket de state (locks S3).

El **apply** lo hace GitHub Actions con el rol `github-terraform-apply`.
