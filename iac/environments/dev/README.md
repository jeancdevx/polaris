# Entorno dev

Prerequisito: `iac/bootstrap` aplicado y bucket S3 de state disponible.

## Inicialización

1. Copiar `dev.tfvars.example` → `dev.tfvars` y ajustar `aws_profile`.
2. En `backend.tf`, reemplazar `REPLACE_WITH_BOOTSTRAP_OUTPUT_state_bucket_name`
   con el output `state_bucket_name` del bootstrap.
3. Ejecutar:

```bash
cd iac/environments/dev
terraform init
terraform plan -var-file=dev.tfvars
```

## Variables por entorno (`*.tfvars`)

Los módulos derivan defaults de `environment`, pero conviene declarar en tfvars
los knobs que cambian entre dev/staging/prod:

| Variable                      | dev               | staging            | prod               |
| ----------------------------- | ----------------- | ------------------ | ------------------ |
| `vpc_cidr`                    | `10.0.0.0/16`     | igual              | igual              |
| `azs`                         | 3 AZ us-east-2    | igual              | igual              |
| `enable_nat_gateway`          | `true`            | `true`             | `true`             |
| `single_nat_gateway`          | `true`            | `true`             | `false`            |
| `enable_vpc_endpoints`        | `true`            | `true`             | `true`             |
| `rds_capacity_mode`           | `serverless`      | `provisioned`      | `provisioned`      |
| `rds_serverless_min_capacity` | `0.5`             | —                  | —                  |
| `rds_serverless_max_capacity` | `2`               | —                  | —                  |
| `rds_reader_count`            | `null` (0)        | `1`                | `2`                |
| `rds_writer_instance_class`   | `null`            | `db.t4g.medium`    | `db.r6g.xlarge`    |
| `redis_capacity_mode`         | `serverless`      | `provisioned`      | `provisioned`      |
| `redis_num_shards`            | —                 | `2`                | `3`                |
| `redis_node_type`             | —                 | `cache.t4g.medium` | `cache.r7g.xlarge` |
| `kafka_broker_instance_type`  | `kafka.m5.large`  | `kafka.m5.large`   | `kafka.m5.xlarge`  |
| `kafka_log_retention_hours`   | `168`             | `168`              | `336`              |
| `cognito_mfa_configuration`   | `OFF`             | `OPTIONAL`         | `OPTIONAL`         |
| `dynamodb_billing_mode`       | `PAY_PER_REQUEST` | `PROVISIONED`      | `PROVISIONED`      |

Plantillas de referencia: `dev.tfvars.example`, `staging.tfvars.example`,
`prod.tfvars.example`.

## Módulos desplegados

| Fase | Módulo            | Estado |
| ---- | ----------------- | ------ |
| 2.1  | `vpc`             | ✅     |
| 2.2  | `security-groups` | ✅     |
| 2.3  | `iam`             | ✅     |
| 2.4  | `rds`             | ✅     |
| 2.5  | `redis`           | ✅     |
| 2.6  | `kafka`           | ✅     |
| 2.7  | `cognito`         | ✅     |
| 2.8  | `dynamodb`        | ✅     |
