# github-terraform

Rol OIDC para `terraform apply` desde GitHub Actions (environment protegido).

- Trust: `repo:<owner>/<repo>:environment:<env>` (mismo patrón que
  `github-oidc`).
- Acceso RW al bucket de state (objetos bajo `state_key_prefix` si se define).
- `PowerUserAccess` para recursos de aplicación, sin acceso administrativo de
  cuenta.
- Política IAM adicional limitada a roles y políticas con prefijo
  `polaris-<env>-*`, necesaria para que Terraform administre los roles del
  proyecto.

El **plan** lo ejecuta Atlantis con su propio task role (módulo `atlantis`).
