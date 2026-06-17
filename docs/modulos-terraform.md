# Módulos Terraform — Documentación Detallada

> Estado: En progreso (3 de ~12 módulos completados)

---

## 1. Módulo VPC (`iac/modules/vpc/`)

### Propósito

Provisionar la red completa del proyecto: VPC, subnets (públicas, privadas,
datos), Internet Gateway, NAT Gateways, route tables, VPC endpoints y security
groups.

### Arquitectura de Red

```
VPC (10.0.0.0/16)
├── Public Subnets  (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
│   └── Internet Gateway → Internet
│   └── NAT Gateways (uno por AZ)
├── Private Subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
│   └── NAT Gateway → Internet (para ECS, Lambda, etc.)
└── Data Subnets    (10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24)
    └── Sin salida a internet (solo VPC endpoints)
```

### Archivos

| Archivo              | Responsabilidad                                           |
| -------------------- | --------------------------------------------------------- |
| `variables.tf`       | 14 variables configurables                                |
| `locals.tf`          | Nombre del proyecto y tags comunes                        |
| `vpc.tf`             | Recurso `aws_vpc` con DNS habilitado                      |
| `subnets.tf`         | 3 tipos de subnets × N AZs                                |
| `igw.tf`             | Internet Gateway                                          |
| `nat.tf`             | EIPs + NAT Gateways (uno por AZ o single)                 |
| `route_tables.tf`    | Route tables públicas, privadas y de datos + asociaciones |
| `vpc_endpoints.tf`   | Gateway endpoints (S3, DynamoDB) + Interface endpoints    |
| `security_groups.tf` | SG para VPC endpoints interface                           |
| `data.tf`            | Data source `aws_region`                                  |
| `outputs.tf`         | 11 outputs (vpc_id, subnet_ids, route_table_ids, etc.)    |

### Decisiones de Diseño

**Tres tiers de subnets:**

- **Public**: Recursos que necesitan IP pública directa (ALB público). Tienen
  `map_public_ip_on_launch = true`.
- **Private**: Recursos que necesitan salida a internet pero no deben ser
  accesibles directamente (ECS Fargate, Lambdas con VPC). Usan NAT Gateway.
- **Data**: Recursos que NO necesitan salida a internet (RDS, ElastiCache, MSK).
  Solo se comunican via VPC endpoints. Mayor seguridad.

**NAT Gateway configurable:**

- `single_nat_gateway = false` (default): Un NAT Gateway por AZ. Mayor
  disponibilidad, mayor costo (~$32/mes por NAT + data transfer).
- `single_nat_gateway = true`: Un solo NAT Gateway en una AZ. Menor costo, pero
  si esa AZ cae, las subnets privadas de las otras AZ pierden salida a internet.

**VPC Endpoints automáticos:**

- **Gateway** (gratis): S3, DynamoDB. Se agregan a todas las route tables.
- **Interface** (costo por hora + data processing): ECR API, ECR DKR, CloudWatch
  Logs, STS, SSM, Secrets Manager, KMS. Usan `private_dns_enabled = true` para
  que las llamadas a los servicios de AWS vayan por el endpoint sin cambiar el
  código.

**Por qué no usar el módulo terraform-aws-modules/vpc:** El módulo de la
comunidad es excelente pero es un monolito de ~5000 líneas. Para este proyecto,
crear nuestro propio módulo nos da:

- Control total sobre qué recursos se crean
- Menos superficie de ataque (no crea recursos que no usamos)
- Más fácil de entender y mantener para el equipo
- Alineado con la convención de archivos granulares por responsabilidad

### Outputs Principales

| Output               | Tipo         | Uso                                |
| -------------------- | ------------ | ---------------------------------- |
| `vpc_id`             | string       | Input para ECS, RDS, Redis, Kafka  |
| `public_subnet_ids`  | list(string) | Subnets para ALB público           |
| `private_subnet_ids` | list(string) | Subnets para ECS Fargate, Lambda   |
| `data_subnet_ids`    | list(string) | Subnets para RDS, ElastiCache, MSK |
| `nat_gateway_ids`    | list(string) | Referencia para debugging          |
| `vpc_endpoint_ids`   | map(string)  | Verificar endpoints creados        |

---

## 2. Módulo ECS (`iac/modules/ecs/`)

### Propósito

Provisionar el clúster ECS Fargate, task definitions, servicios, ALB, target
groups, auto-scaling, IAM roles y security groups para los microservicios
NestJS.

### Arquitectura

```
ECS Cluster (polaris-dev)
├── Task Definition: api-service (512 CPU, 1024 MB)
│   └── Service: 3 réplicas en Fargate
│       └── ALB Target Group → /api-service/*
├── Task Definition: event-processor-service
│   └── Service: 3 réplicas en Fargate
├── Task Definition: reservation-service
│   └── Service: 3 réplicas en Fargate
├── Task Definition: admin-service
│   └── Service: 3 réplicas en Fargate
└── ALB (interno o público)
    ├── Listener HTTP :80
    └── Listener HTTPS :443 (opcional, con certificado ACM)
```

### Archivos

| Archivo              | Responsabilidad                                                                        |
| -------------------- | -------------------------------------------------------------------------------------- |
| `variables.tf`       | 15 variables configurables                                                             |
| `locals.tf`          | Nombre del clúster y tags comunes                                                      |
| `cluster.tf`         | ECS Cluster con Container Insights                                                     |
| `iam.tf`             | Task execution role + políticas (ECSTaskExecutionRolePolicy + SecretsManagerReadWrite) |
| `task_definition.tf` | Task definitions dinámicas con container_definitions JSON                              |
| `service.tf`         | ECS Services con Fargate, circuit breaker, load balancer                               |
| `alb.tf`             | ALB + listeners HTTP/HTTPS                                                             |
| `target_groups.tf`   | Target groups + listener rules por servicio                                            |
| `autoscaling.tf`     | AppAutoScaling por CPU y memoria                                                       |
| `security_groups.tf` | SG para ALB y ECS services                                                             |
| `data.tf`            | Data sources (region, vpc)                                                             |
| `outputs.tf`         | 10 outputs (cluster, services, ALB, SGs, etc.)                                         |

### Decisiones de Diseño

**Fargate sobre EC2:**

- No necesitamos gestionar instancias EC2
- Auto-scaling a nivel de task, no de instancia
- Mejor aislamiento entre servicios
- Costo predecible por vCPU/GB de memoria

**Task definitions dinámicas via `var.services` (map):** En lugar de crear un
archivo por cada servicio, el módulo acepta un map:

```hcl
services = {
  api-service = {
    name            = "api-service"
    container_name  = "api"
    container_image = "123456789.dkr.ecr.us-east-2.amazonaws.com/polaris-api-service:latest"
    container_port  = 3000
    cpu             = 512
    memory          = 1024
    desired_count   = 3
    health_check_path = "/health"
    environment_vars = {
      NODE_ENV = "production"
    }
    secrets = {
      DATABASE_URL = "arn:aws:secretsmanager:us-east-2:123456789:secret:db-url-abc123"
    }
  }
}
```

Esto permite agregar/quitar servicios sin modificar el módulo, solo cambiando la
variable.

**Deployment Circuit Breaker:** Habilitado con `rollback = true`. Si un
deployment falla (tasks no pasan health check), ECS automáticamente hace
rollback al task definition anterior.

**Health checks:** Cada servicio tiene un health check por HTTP:
`curl -f http://localhost:{port}/health`. El ALB también tiene health checks
independientes.

**Auto-scaling:**

- Target tracking por CPU (default 70%)
- Target tracking por memoria (default 70%)
- Min/max configurables por servicio

**ALB interno por defecto:** `alb_internal = true` significa que el ALB solo es
accesible desde dentro de la VPC. Para el API Gateway público, se usaría un ALB
separado con `alb_internal = false` o se integraría directamente con el API
Gateway.

### Outputs Principales

| Output                    | Tipo        | Uso                               |
| ------------------------- | ----------- | --------------------------------- |
| `cluster_arn`             | string      | Input para Lambda, IoT Core rules |
| `service_arns`            | map(string) | Referencia a cada servicio        |
| `alb_dns_name`            | string      | DNS del ALB para API Gateway      |
| `target_group_arns`       | map(string) | Para configurar integraciones     |
| `security_group_ids`      | object      | SG IDs para reglas de RDS, Redis  |
| `task_execution_role_arn` | string      | Para compartir entre módulos      |

---

## 3. Módulo Aurora (`iac/modules/rds/`)

### Propósito

Provisionar un clúster Aurora PostgreSQL-compatible para almacenamiento
persistente de datos del sistema (usuarios, reservas, logs de auditoría).

### Motor: Aurora PostgreSQL 17.7

Usamos `aws_rds_cluster` con `engine = "aurora-postgresql"` y
`engine_version = "17.7"`. Aurora es compatible a nivel de protocolo con
PostgreSQL estándar, por lo que las aplicaciones se conectan igual (mismo puerto
5432, mismo driver, mismas queries).

### Arquitectura

```
Aurora Cluster (polaris-dev-aurora)
├── Engine: Aurora PostgreSQL 17.7
├── Storage: aurora (Standard) o aurora-iopt1 (I/O-Optimized)
├── Writer Instance (1) — db.serverless o db.r6g.large
├── Reader Instances (0+) — para lecturas
├── Subnets: Data subnets (sin internet)
├── Security Group: Solo ECS services pueden conectar
├── Encryption: KMS key dedicada
├── Backups: 7 días de retención
└── Logs: CloudWatch (postgresql, upgrade)
```

### Archivos

| Archivo              | Responsabilidad                                                    |
| -------------------- | ------------------------------------------------------------------ |
| `variables.tf`       | 24 variables configurables                                         |
| `locals.tf`          | Nombre, tags, parameter group family dinámico                      |
| `cluster.tf`         | `aws_rds_cluster` con configuración de storage, backup, serverless |
| `instances.tf`       | Writer(s) + Reader(s) `aws_rds_cluster_instance`                   |
| `subnet_group.tf`    | DB subnet group (data subnets)                                     |
| `parameter_group.tf` | DB cluster parameter group dinámico                                |
| `security_groups.tf` | SG con ingress por SG IDs y/o CIDRs                                |
| `kms.tf`             | KMS key + alias para encriptación                                  |
| `outputs.tf`         | 14 outputs (endpoints, instances, etc.)                            |

### Decisiones de Diseño

**Scalability Type configurable:**

| Tipo            | Uso ideal                        | Dev        | Prod       |
| --------------- | -------------------------------- | ---------- | ---------- |
| `serverless-v2` | Cargas variables, dev/staging    | ✅ Default | ❌         |
| `provisioned`   | Cargas predecibles, prod estable | ❌         | ✅ Default |

- **Serverless v2**: Escala automáticamente entre `min_acu` y `max_acu` (default
  0.5 → 2 ACU). Se apaga casi por completo cuando no hay tráfico. Ideal para dev
  donde el uso es intermitente.
- **Provisioned**: Instancias fijas (`db.r6g.large` o superior). Costo
  predecible, mejor para prod con tráfico constante.

**Storage Type configurable:**

| Tipo                           | Modelo de costo                             | Cuándo usar               |
| ------------------------------ | ------------------------------------------- | ------------------------- |
| `aurora` (Standard)            | Pay-per-I/O. Storage barato + cargo por I/O | I/O < 25% del costo total |
| `aurora-iopt1` (I/O-Optimized) | I/O incluido en el precio. Storage más caro | I/O > 25% del costo total |

- **Dev**: `aurora` (Standard) — las cargas de desarrollo no generan suficiente
  I/O para justificar I/O-Optimized.
- **Prod**: Evaluar métricas. Si los costos de I/O superan el 25% del costo
  total de la base de datos, migrar a `aurora-iopt1`.

**Parameter group family dinámico:**

El módulo calcula automáticamente la familia del parameter group basado en la
versión del engine:

```hcl
parameter_group_family = "aurora-postgresql${split(".", var.engine_version)[0]}"
# engine_version = "17.7" → "aurora-postgresql17"
```

**HTTP Endpoint para Serverless v2:**

`enable_http_endpoint = true` cuando `scalability_type = "serverless-v2"`. Esto
permite consultas SQL via HTTP (Data API), útil para Lambdas sin necesidad de
VPC.

**Multi-AZ:**

El writer se despliega en una AZ y el standby síncrono en otra. Los readers se
distribuyen entre las AZs disponibles.

**Lifecycle ignore_changes:**

- `master_password`: No rotar password con Terraform
- `scaling_configuration`: No revertir cambios manuales de ACU

### Outputs Principales

| Output                    | Tipo         | Uso                                          |
| ------------------------- | ------------ | -------------------------------------------- |
| `cluster_endpoint`        | string       | Endpoint writer para conexiones de escritura |
| `cluster_reader_endpoint` | string       | Endpoint reader para conexiones de lectura   |
| `cluster_port`            | number       | Puerto (5432)                                |
| `db_name`                 | string       | Nombre de la base de datos                   |
| `writer_instance_arns`    | list(string) | ARNs de instancias writer                    |
| `reader_instance_arns`    | list(string) | ARNs de instancias reader                    |
| `security_group_id`       | string       | Para debugging                               |
| `kms_key_arn`             | string       | Referencia a la KMS key                      |

### Esquema de Base de Datos

Las tablas se crean después del deploy (no con Terraform). El esquema incluye:

```sql
users           -- Usuarios registrados
vehicles        -- Vehículos asociados a usuarios
reservations    -- Reservas de plazas
parking_spots   -- Estado de plazas (10 plazas)
audit_logs      -- Logs de auditoría (todos los eventos)
rfid_tags       -- Tags RFID autorizados
sensor_data     -- Datos históricos de sensores
```

---

## Resumen de Módulos Completados

| Módulo | Archivos | Variables | Outputs | Recursos AWS                                                   |
| ------ | -------- | --------- | ------- | -------------------------------------------------------------- |
| VPC    | 11       | 14        | 11      | VPC, 3×N subnets, IGW, N×NAT, 3×RT, N endpoints, 1 SG          |
| ECS    | 12       | 15        | 10      | Cluster, N×TaskDef, N×Service, ALB, N×TG, N×ASG, 2 SG, 1 IAM   |
| Aurora | 9        | 24        | 14      | Cluster, N×Instances, SubnetGroup, ParamGroup, 1 SG, 1 KMS Key |

## Próximos Módulos

1. **ElastiCache Redis** — Caché y estado en tiempo real
2. **MSK Kafka** — Broker de eventos
3. **Lambda** — Funciones serverless
4. **API Gateway** — Público y privado
5. **Cognito** — Autenticación y gestión de usuarios
6. **AppSync** — GraphQL en tiempo real
7. **IoT Core** — Comunicación con ESP32
8. **S3** — Buckets para logs, backups, assets
9. **DynamoDB** — Tablas para RFID, sensores, WebSockets
