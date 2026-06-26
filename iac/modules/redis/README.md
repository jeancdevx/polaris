# Redis module

ElastiCache Redis con topología distinta por entorno, según
`docs/arquitectura.md` sección 10.

## Modos de capacidad

| Entorno     | Modo          | Configuración                                                      |
| ----------- | ------------- | ------------------------------------------------------------------ |
| **dev**     | `serverless`  | ElastiCache Serverless, hasta 10 GB / 5000 ECPU                    |
| **staging** | `provisioned` | Cluster mode, 2 shards, 1 réplica por shard                        |
| **prod**    | `provisioned` | Cluster mode, **3 shards**, 1 réplica por shard, `cache.r7g.large` |

Uso previsto: ocupación en tiempo real, caché, locks distribuidos (TTL 5 min en
aplicación).

## Archivos

| Archivo                | Responsabilidad                               |
| ---------------------- | --------------------------------------------- |
| `subnet-group.tf`      | Subnet group (provisioned)                    |
| `parameter-group.tf`   | Parameter group `cluster-enabled=yes`         |
| `serverless.tf`        | ElastiCache Serverless (dev)                  |
| `replication-group.tf` | Replication group cluster mode (staging/prod) |

## Credenciales

- **Serverless (dev):** TLS (`rediss://`) sin AUTH token explícito en Terraform.
- **Provisioned:** `transit_encryption_enabled` genera `auth_token` automático
  si no se provee.

El secret definitivo puede moverse a `secrets-manager` en Fase 2.10.

## Uso dev

```hcl
module "redis" {
  source = "../../modules/redis"

  project_name       = "polaris"
  environment        = "dev"
  subnet_ids         = module.vpc.data_subnet_ids
  security_group_ids = [module.security_groups.redis_security_group_id]
}
```

## Outputs clave

- `configuration_endpoint`, `primary_endpoint`, `reader_endpoint`
- `redis_url` (sensitive)
- `auth_token` (provisioned, sensitive)
- `capacity_mode`, `num_shards`
