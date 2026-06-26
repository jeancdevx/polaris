# Kafka module (Amazon MSK)

Amazon MSK con IAM SASL y cifrado, según `docs/arquitectura.md` sección 8.

## Configuración por entorno

| Entorno     | Brokers | Instance type     | Retención logs | RF / min ISR |
| ----------- | ------- | ----------------- | -------------- | ------------ |
| **dev**     | 3       | `kafka.m5.large`  | 168 h (7 días) | 3 / 2        |
| **staging** | 3       | `kafka.m5.large`  | 168 h          | 3 / 2        |
| **prod**    | 3       | `kafka.m5.xlarge` | 336 h          | 3 / 2        |

## Características

- Autenticación **IAM SASL** (`bootstrap_brokers_sasl_iam`)
- Cifrado en tránsito (TLS) y en reposo
- `auto.create.topics.enable=false` — topics vía `kafka-topic-creator` (Fase
  2.12)
- Broker logs en CloudWatch
- Sin acceso público

## Archivos

| Archivo            | Responsabilidad                               |
| ------------------ | --------------------------------------------- |
| `configuration.tf` | MSK configuration (retention, RF, partitions) |
| `logging.tf`       | CloudWatch log group                          |
| `cluster.tf`       | MSK cluster                                   |

## Uso

```hcl
module "kafka" {
  source = "../../modules/kafka"

  project_name       = "polaris"
  environment        = "dev"
  subnet_ids         = module.vpc.data_subnet_ids
  security_group_ids = [module.security_groups.msk_security_group_id]
}
```

Tras el apply, pasar `cluster_arn` al módulo `iam` para políticas exactas:

```hcl
module "iam" {
  msk_cluster_arn = module.kafka.cluster_arn
}
```

## Cliente (NestJS / Lambda)

- Bootstrap: output `bootstrap_brokers_sasl_iam`
- Librería: `aws-msk-iam-sasl-signer-js` + KafkaJS
- Puerto SG: **9098** (IAM SASL)

## Outputs clave

- `cluster_arn`, `cluster_name`, `cluster_uuid`
- `bootstrap_brokers_sasl_iam`
- `configuration_arn`
