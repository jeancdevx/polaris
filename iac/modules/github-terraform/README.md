# github-terraform

Rol OIDC para `terraform apply` desde GitHub Actions (environment protegido).

- Trust: `repo:<owner>/<repo>:environment:<env>` (mismo patrón que
  `github-oidc`).
- Acceso RW al bucket de state (objetos bajo `state_key_prefix` si se define).
- `AdministratorAccess` opcional (`grant_administrator_access`, default `true`
  en dev).

El **plan** lo ejecuta Atlantis con su propio task role (módulo `atlantis`).
