# RDS module

Aurora PostgreSQL con topología distinta por entorno, según
`docs/arquitectura.md` sección 10.

## Modos de capacidad

| Entorno     | Modo          | Configuración                                                  |
| ----------- | ------------- | -------------------------------------------------------------- |
| **dev**     | `serverless`  | Aurora Serverless v2, min **0.5 ACU**, max 2 ACU, sin réplicas |
| **staging** | `provisioned` | Writer `db.t4g.medium` + **1** read replica                    |
| **prod**    | `provisioned` | Writer `db.r6g.xlarge` + **2** read replicas, Multi-AZ         |

`capacity_mode` y `reader_count` se derivan de `environment` salvo override
explícito.

## Archivos

| Archivo                    | Responsabilidad                       |
| -------------------------- | ------------------------------------- |
| `subnet-group.tf`          | DB subnet group en data tier          |
| `cluster.tf`               | Aurora cluster + scaling serverless   |
| `instances-serverless.tf`  | Instancia `db.serverless` (dev)       |
| `instances-provisioned.tf` | Writer + read replicas (staging/prod) |

## Credenciales

`manage_master_user_password = true` — AWS crea el secret en Secrets Manager. La
rotación se configura en el módulo `secrets-manager` (Fase 2.10) usando
`master_user_secret_arn`.

## Uso dev

```hcl
module "rds" {
  source = "../../modules/rds"

  project_name           = "polaris"
  environment          = "dev"
  subnet_ids             = module.vpc.data_subnet_ids
  vpc_security_group_ids = [module.security_groups.rds_security_group_id]
  monitoring_role_arn    = module.iam.rds_enhanced_monitoring_role_arn
}
```

## Uso prod (override explícito opcional)

```hcl
module "rds" {
  source = "../../modules/rds"

  project_name           = "polaris"
  environment          = "prod"
  capacity_mode        = "provisioned"
  reader_count         = 2
  writer_instance_class = "db.r6g.xlarge"
  subnet_ids             = module.vpc.data_subnet_ids
  vpc_security_group_ids = [module.security_groups.rds_security_group_id]
  monitoring_role_arn    = module.iam.rds_enhanced_monitoring_role_arn
}
```

## Outputs clave

- `cluster_endpoint`, `cluster_reader_endpoint`
- `master_user_secret_arn`
- `capacity_mode`, `reader_count`
