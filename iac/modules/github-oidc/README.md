# github-oidc

Federación OIDC entre GitHub Actions y AWS para el pipeline de CD, sin
credenciales estáticas.

## Qué crea

- `aws_iam_openid_connect_provider` para `token.actions.githubusercontent.com`
  (uno por cuenta; desactivable con `create_oidc_provider = false` si otro
  entorno ya lo creó).
- Rol `<project>-<env>-github-deploy` asumible únicamente por jobs del
  repositorio `github_repository` que corran en el GitHub environment
  `github_environment` (claim `sub` = `repo:<owner>/<repo>:environment:<env>`).
- Política inline de mínimo privilegio: push/pull a los repos ECR
  `<project>-<env>-*` y `ecs:UpdateService`/`ecs:DescribeServices` sobre los
  servicios del cluster `<project>-<env>-cluster`.

## Uso

```hcl
module "github_oidc" {
  source = "../../modules/github-oidc"

  project_name      = var.project_name
  environment       = var.environment
  github_repository = "jeancdevx/polaris"

  tags = var.tags
}
```

El output `deploy_role_arn` se registra en GitHub como secret
`AWS_DEPLOY_ROLE_ARN` del environment correspondiente (ver `docs/ci-cd.md`).
