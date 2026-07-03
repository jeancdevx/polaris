# Entorno prod — producción con edge (galaxymorph.com).

Prerequisito: `iac/bootstrap` aplicado. Staging validado antes del primer apply
en prod.

## Inicialización

1. Copiar `prod.tfvars.example` → `prod.tfvars`.
2. `backend.hcl` con `key = env/prod/terraform.tfstate`.
3. GitHub environment `prod` con required reviewers (ver `docs/ci-cd.md`).

```bash
cd iac/environments/prod
terraform init -backend-config=backend.hcl
terraform plan -var-file=prod.tfvars
```

## Capacidades vs staging

| Aspecto       | staging                   | prod                       |
| ------------- | ------------------------- | -------------------------- |
| NAT           | Single NAT                | NAT por AZ                 |
| RDS           | `db.t4g.medium`, 1 reader | `db.r6g.xlarge`, 2 readers |
| Redis         | 2 shards `t4g.medium`     | 3 shards `r7g.xlarge`      |
| MSK           | `kafka.m5.large`, 100 GB  | `kafka.m5.xlarge`, 500 GB  |
| MSK retention | 168 h                     | 336 h                      |
| Backup RDS    | 14 días                   | 30 días                    |

## URLs públicas

| Servicio  | URL                                                |
| --------- | -------------------------------------------------- |
| API       | `https://api.galaxymorph.com`                      |
| Admin API | `https://admin-api.galaxymorph.com`                |
| Web-admin | `https://admin.galaxymorph.com`                    |
| GraphQL   | `https://graphql.galaxymorph.com/graphql`          |
| Auth      | `https://auth.galaxymorph.com`                     |
| Atlantis  | `https://atlantis.galaxymorph.com` (si habilitado) |

## Apply

Solo vía merge a `production` + `iac-apply-production.yml`, o manual con perfil
autorizado y revisión del plan de Atlantis.
