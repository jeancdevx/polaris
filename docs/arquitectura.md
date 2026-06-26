# Polaris — Arquitectura del Sistema

> Sistema de estacionamiento público IoT sobre AWS.  
> Región: **us-east-2** · Alta disponibilidad: **3 AZ**  
> Versión: **1.0** (post-reset)

---

## 1. Objetivo

Automatizar acceso vehicular, monitoreo de ocupación en tiempo real, reservas para usuarios registrados y auditoría completa, con arquitectura **orientada a eventos** y componentes desacoplados.

---

## 2. Principios de diseño

1. **Vertical slices** — cada fase entrega valor funcional (código + IaC mínimo + tests).
2. **Kafka como bus de dominio** — Amazon MSK es requisito fijo; no se reemplaza por otros servicios.
3. **Complementar, no duplicar** — EventBridge orquesta; SQS absorbe picos y DLQ; Kafka transporta eventos de negocio.
4. **Infraestructura incremental** — Terraform solo despliega lo que el código ya usa.
5. **Un monorepo, un toolchain** — Turborepo + pnpm + Node 24 + ESM + Rolldown.

---

## 3. Vista general

```
                    ┌─────────────── Internet ───────────────┐
                    │                                      │
              Route53 / CloudFront / WAF (staging/prod)      │
                    │                                      │
         ┌──────────▼──────────┐              ┌────────────▼────────────┐
         │  API Gateway HTTP   │              │      AWS AppSync        │
         │  (público + privado)│              │  GraphQL + subscriptions│
         └──────────┬──────────┘              └────────────┬────────────┘
                    │                                      │
         ┌──────────▼──────────────────────────────────────▼──────────┐
         │              ECS Fargate (3 AZ) — NestJS services           │
         │  api-service │ event-processor │ reservation │ admin        │
         └──────┬───────────────┬─────────────────┬───────────┬────────┘
                │               │                 │           │
    ┌───────────▼───┐   ┌───────▼───────┐  ┌──────▼─────┐ ┌──▼────────┐
    │ Aurora PG     │   │ ElastiCache   │  │ Amazon MSK │ │ DynamoDB  │
    │ (RDS)         │   │ Redis         │  │ (Kafka)    │ │           │
    └───────────────┘   └───────────────┘  └──────┬─────┘ └───────────┘
                                                   │
    ┌──────────────────────────────────────────────▼──────────────────┐
    │ EventBridge (reglas) ◄──► Lambda (Node 24) ◄──► SQS + DLQ       │
    └──────────────────────────────┬──────────────────────────────────┘
                                   │
    ┌──────────────────────────────▼──────────────────────────────────┐
    │ AWS IoT Core (MQTT) ◄── ESP32 (sensores, RFID, actuadores)    │
    └─────────────────────────────────────────────────────────────────┘
```

---

## 4. Capa de red (VPC)

Referencia: [Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)

```
VPC 10.0.0.0/16
├── Public subnets   (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)   → ALB, NAT
├── Private subnets  (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) → ECS, Lambda
└── Data subnets     (10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24) → RDS, Redis, MSK
```

- **NAT Gateway**: uno por AZ en prod; `single_nat_gateway = true` solo en dev (costo).
- **VPC Endpoints**: S3, DynamoDB (gateway); ECR, Logs, STS, Secrets Manager, KMS (interface).
- **Security groups**: módulo dedicado, sin dependencias circulares con otros módulos.

---

## 5. Capa de entrada

### 5.1 API Gateway HTTP API (v2)

Referencia: [HTTP APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)

**Mejora respecto al diseño anterior:** usar **HTTP API** en lugar de REST API (v1). Menor costo, menor latencia, integración nativa con JWT authorizers (Cognito).

| API | Acceso | Integración |
|-----|--------|-------------|
| **Pública** | Internet + Cognito JWT | VPC Link → ALB → `api-service` |
| **Privada** | Solo VPC (resource policy + VPCE) | VPC Link → ALB → servicios internos |

Endpoints públicos:

```
POST   /auth/signup
POST   /auth/signin
POST   /auth/refresh
POST   /auth/logout
GET    /parking/availability
POST   /parking/reserve
DELETE /parking/reserve/{id}
GET    /user/reservations
GET    /user/profile
PUT    /user/profile
```

Endpoints privados (internos):

```
POST   /internal/sensor/occupancy
POST   /internal/vehicle/entry
POST   /internal/vehicle/exit
GET    /internal/parking/status
POST   /internal/reservation/validate
POST   /internal/rfid/validate
POST   /internal/audit/log
GET    /internal/admin/metrics
POST   /admin/users
PUT    /admin/users/{id}
DELETE /admin/users/{id}
GET    /admin/audit
```

### 5.2 AppSync (tiempo real)

Referencia: [AWS AppSync](https://docs.aws.amazon.com/appsync/latest/devguide/welcome.html)

- GraphQL para app móvil y web admin.
- Subscriptions: `onOccupancyChanged`, `onReservationCreated`.
- Data sources: RDS (usuarios/reservas), Redis (ocupación), DynamoDB (telemetría).
- Auth: Cognito User Pools.

### 5.3 Perímetro (staging/prod)

- **Route53** — DNS + health checks.
- **CloudFront** — assets estáticos web admin + cache selectivo de API.
- **WAF** — rate limiting, OWASP managed rules.

---

## 6. Microservicios (ECS Fargate + NestJS)

Referencia: [ECS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)

| Servicio | Responsabilidad | Escala mínima (prod) |
|----------|-----------------|----------------------|
| **api-service** | REST público, auth Cognito, CRUD usuarios/reservas consulta | 3 tasks / 3 AZ |
| **event-processor-service** | Consumidor Kafka, actualiza Redis/RDS, publica EventBridge | 3 tasks |
| **reservation-service** | Lógica de reservas, locks Redis, expiración | 2 tasks |
| **admin-service** | Gestión usuarios admin, auditoría, métricas | 2 tasks |

- Runtime contenedor: **Node 24**.
- Build: bundle con **Rolldown** → imagen Docker multi-stage → **ECR**.
- Auto-scaling: CPU/memoria vía Application Auto Scaling.
- Logs: CloudWatch Logs (structured JSON).

---

## 7. Hardware IoT (prototipo)

Inventario fijo del laboratorio — detalle de nodos ESP32, sensores y flujos paso a paso en [`flujos.md`](./flujos.md).

| Componente | Cantidad |
|------------|----------|
| ESP32 DevKit V1 | 4 (entrada, salida, plazas A, plazas B) |
| RFID RC522 | 2 |
| HC-SR04 | 1 (entrada — control seguro de barrera) |
| LCD 16×2 I2C | 1 |
| SG90 | 2 |
| Tarjetas RFID | 10 |
| FC-51 IR | 10 (1 por plaza) |
| LED RGB | 10 |
| Protoboard | 4 |

**Regla de barrera en entrada:** cierre por HC-SR04 (vehículo despejó la zona), no por temporizador fijo.

---

## 8. Bus de eventos — Amazon MSK (Kafka)

Referencia: [Amazon MSK](https://docs.aws.amazon.com/msk/latest/developerguide/what-is-msk.html)

**Requisito fijo del proyecto.** MSK es el sistema de mensajería principal entre servicios.

### Cluster

| Entorno | Configuración |
|---------|---------------|
| **dev** | 3 brokers `kafka.m5.large`, IAM auth, 7 días retención |
| **prod** | 3 brokers `kafka.m5.xlarge`, RF=3, encryption in-transit |

### Topics

Definidos en `@polaris/shared-types` → `KAFKA_TOPICS`:

| Topic | Productor | Consumidor principal |
|-------|-----------|----------------------|
| `vehicle.entry` | event-processor / Lambda | event-processor, audit |
| `vehicle.exit` | event-processor / Lambda | event-processor, audit |
| `sensor.occupancy` | IoT rule → Lambda | event-processor |
| `sensor.proximity` | IoT rule → Lambda | event-processor (métricas) |
| `reservation.created` | reservation-service | event-processor, notification Lambda |
| `reservation.cancelled` | reservation-service | event-processor |
| `rfid.validation` | rfid-validator Lambda | event-processor |
| `audit.events` | varios | audit-logger Lambda |

### Autenticación

- **IAM SASL** en AWS ([MSK IAM access control](https://docs.aws.amazon.com/msk/latest/developerguide/iam-access-control.html)).
- Cliente: `aws-msk-iam-sasl-signer-js` + KafkaJS en servicios NestJS.

---

## 9. Orquestación complementaria

### EventBridge

Referencia: [Amazon EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html)

- Bus custom `polaris-events`.
- Reglas de ejemplo:
  - `vehicle.entry` → Lambda `audit-logger`
  - `reservation.created` → Lambda `notification-sender`
  - Schedule `rate(5 minutes)` → Lambda `reservation-cleanup`
  - Schedule `rate(1 day)` → Lambda `daily-report-generator`

### SQS

Referencia: [Amazon SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)

| Cola | Propósito |
|------|-----------|
| `reservation-queue` | Procesamiento asíncrono de reservas |
| `dlq-sensor-processing` | DLQ sensores |
| `dlq-notification-sender` | DLQ notificaciones push |

---

## 10. Capa de datos

### Aurora PostgreSQL

Referencia: [Aurora PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html)

- **dev**: Aurora Serverless v2 (min 0.5 ACU).
- **prod**: Multi-AZ + 1–2 read replicas.
- Tablas: `users`, `vehicles`, `reservations`, `parking_spots`, `audit_logs`, `rfid_tags`, `sensor_data`.
- Credenciales: **Secrets Manager** con rotación automática.

### ElastiCache Redis

Referencia: [ElastiCache Redis](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/WhatIs.html)

- **dev**: Serverless Redis.
- **prod**: Replication group, cluster mode enabled, 3 shards.
- Uso: ocupación en tiempo real, caché, locks distribuidos (reservas), TTL 5 min en ocupación.

### DynamoDB

Referencia: [DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)

| Tabla | Clave | Uso |
|-------|-------|-----|
| `RFIDValidations` | `rfid_uid` | Historial validaciones RFID |
| `SensorReadings` | `sensorId` + `timestamp` | Time-series sensores |
| `WebSocketConnections` | `connectionId` | Conexiones AppSync activas |

On-demand billing en dev; provisioned/auto-scaling en prod.

---

## 11. AWS IoT Core + firmware ESP32

Referencia: [AWS IoT Core](https://docs.aws.amazon.com/iot/latest/developerguide/what-is-aws-iot.html)

### Topics MQTT

```
parking/sensors/occupancy/{sensorId}
parking/rfid/entry/{deviceId}
parking/rfid/exit/{deviceId}
parking/commands/servo/{servoId}
parking/commands/display/{displayId}
```

### IoT Rules

| Rule | Acción |
|------|--------|
| `sensor/occupancy` | Lambda `sensor-data-processor` → publica a Kafka `sensor.occupancy` |
| `rfid/entry` + `rfid/exit` | Lambda `rfid-validator` |
| `sensor/proximity` | Kafka `sensor.proximity` |

- Autenticación dispositivos: certificados X.509.
- Device Shadows para estado deseado/reportado de actuadores.

---

## 12. Lambda Functions (Node.js 24)

Referencia: [Lambda Node.js 24](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)

| Función | Trigger | Responsabilidad |
|---------|---------|-----------------|
| `rfid-validator` | IoT Rule | Validar RFID, comandos MQTT, evento Kafka |
| `sensor-data-processor` | IoT Rule | Normalizar telemetría → DynamoDB + Kafka |
| `audit-logger` | EventBridge | CloudWatch Logs + archivar S3 |
| `notification-sender` | EventBridge | Push FCM/SNS |
| `reservation-cleanup` | EventBridge schedule | Expirar reservas |
| `occupancy-aggregator` | EventBridge / Kafka | Agregar por zona → Redis |
| `daily-report-generator` | EventBridge schedule | Reporte diario → S3 |
| `health-checker` | EventBridge schedule | Health checks → SNS |
| `kafka-topic-creator` | Terraform provisioner | Crear topics MSK (infra-only) |

- Build: **Rolldown** → zip → runtime `nodejs24.x`.
- Handlers: **async/await** (callbacks no soportados en Node 24).
- VPC: funciones que acceden RDS/Redis/MSK.

---

## 13. Seguridad

| Servicio | Uso |
|----------|-----|
| **Cognito** | User Pools (app móvil/web), MFA opcional para admins |
| **Secrets Manager** | Credenciales RDS, API keys |
| **KMS** | Encryption at rest (RDS, S3, DynamoDB, MSK) |
| **IAM** | Least privilege por servicio/Lambda/task role |
| **WAF** | Protección perimetral (staging/prod) |

---

## 14. Observabilidad

Referencia: [CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html)

- Logs estructurados JSON en todos los servicios.
- Métricas custom: ocupación, latencia API, lag consumidor Kafka.
- Alarmas: CPU > 80 %, error rate > 5 %, ocupación > 90 %.
- **X-Ray** activo en API Gateway y ECS (tracing distribuido).
- Dashboards: sistema general + ocupación en tiempo real.

---

## 15. Almacenamiento S3

| Bucket | Uso |
|--------|-----|
| `polaris-audit-logs-{env}` | Logs auditoría archivados |
| `polaris-backups-{env}` | Backups RDS |
| `polaris-assets-{env}` | Assets estáticos |
| `polaris-alb-logs-{env}` | Access logs ALB |

Lifecycle: Glacier a 90 días. Versioning en backups.

---

## 16. Monorepo — estructura de código

```
polaris/
├── apps/
│   ├── api-service/
│   ├── event-processor-service/
│   ├── reservation-service/
│   └── admin-service/
├── lambdas/
│   ├── rfid-validator/
│   ├── audit-logger/
│   └── ...
├── packages/
│   ├── domain/          (fase 1)
│   ├── database/        (fase 1)
│   ├── kafka/           (fase 4)
│   ├── shared-types/
│   ├── shared-utils/
│   ├── build-config/
│   └── tsconfig/
├── firmware/esp32/
├── infra/local/         docker-compose (Postgres, Redis, Kafka)
└── iac/
    ├── bootstrap/       ✅ existente
    ├── modules/         se crean por fase
    └── environments/
```

### Toolchain

| Herramienta | Uso |
|-------------|-----|
| Node.js 24 | Runtime |
| NestJS 11 | Microservicios |
| TypeScript 6 | Tipado |
| ESM (`"type": "module"`) | Módulos |
| Turborepo | Build/test/lint orchestration |
| pnpm | Workspaces |
| Rolldown | Bundler (lambdas + packages) |
| oxlint | Linter |
| Prettier | Formato |
| Vitest | Tests |
| Husky + commitlint | Git hooks |

---

## 17. Estimación de costos mensual (prod moderado)

| Servicio | ~USD/mes |
|----------|----------|
| ECS Fargate (4 servicios) | 180 |
| Aurora PostgreSQL Multi-AZ | 200 |
| ElastiCache Redis | 150 |
| **Amazon MSK (3 brokers)** | **300** |
| API Gateway + AppSync | 60 |
| Lambda | 20 |
| IoT Core | 5 |
| S3 + CloudFront + WAF | 25 |
| CloudWatch + X-Ray | 30 |
| Cognito | 5 |
| **Total estimado** | **~975** |

---

## 18. Decisiones registradas (ADR)

| ID | Decisión | Motivo |
|----|----------|--------|
| ADR-001 | MSK Kafka como bus principal | Requisito de negocio; desacoplamiento event-driven |
| ADR-002 | HTTP API v2 vs REST API v1 | Costo y latencia ([AWS comparison](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html)) |
| ADR-003 | Aurora vs RDS standalone | Failover automático, read replicas nativas |
| ADR-004 | EventBridge + SQS complementan Kafka | Orquestación AWS-native sin reemplazar MSK |
| ADR-005 | Rolldown para bundles | Performance; alineado con ecosistema Oxc/Vite |
| ADR-006 | Terraform propio (no CDK) | Control granular; módulos por responsabilidad |

---

## 19. Referencias AWS

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [MSK best practices](https://docs.aws.amazon.com/msk/latest/developerguide/bestpractices.html)
- [IoT Core best practices](https://docs.aws.amazon.com/whitepapers/latest/connected-devices-on-aws/best-practices-for-connected-devices-on-aws.html)
- [Lambda best practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
