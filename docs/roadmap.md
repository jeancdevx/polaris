# Roadmap de Implementación — Polaris

> Plan ejecutable fase por fase. **No avanzar de fase sin cumplir el DoD.**  
> Arquitectura: [`arquitectura.md`](./arquitectura.md) · Flujos: [`flujos.md`](./flujos.md)

---

## Reglas del proyecto

1. **Código antes que infra adelantada** — no crear módulos Terraform para servicios sin código.
2. **Kafka es fijo** — MSK se despliega en Fase 2; topics definidos en `@polaris/shared-types`.
3. **Vertical slices** — cada fase entrega algo demostrable.
4. **Versiones exactas** — `pnpm add -E` para todas las dependencias.
5. **Commits convencionales** — `feat:`, `fix:`, `chore:`, etc.
6. **Lambdas** — handlers envueltos con `@polaris/lambda-core` (`instrumentLambdaHandler`); Powertools Logger + Tracer; X-Ray activo en Terraform.

---

## Convenciones Lambda (Powertools)

Paquete: `@polaris/lambda-core` · Docs: [Powertools TypeScript](https://docs.aws.amazon.com/powertools/typescript/latest/)

| Fase | Utilidades Powertools |
|------|----------------------|
| **2.12+** | Logger, Tracer (base en todas las Lambdas) |
| **5–6** | Metrics, Parameters, Idempotency, Parser, Kafka consumer |
| **ECS** | No Powertools — Pino JSON + OTel/X-Ray (ver `arquitectura.md` §12.1) |

Matriz completa de adopción: `docs/arquitectura.md` §12.1.

---

## Fase 0 — Fundación del monorepo ✅

**Objetivo:** toolchain operativo, estructura limpia, bootstrap Terraform intacto.

| # | Tarea | DoD |
|---|-------|-----|
| 0.1 | Reset repo: conservar `iac/bootstrap`, eliminar módulos viejos | Solo bootstrap en `iac/` |
| 0.2 | Estructura `apps/`, `packages/`, `lambdas/`, `firmware/`, `infra/local/` | Carpetas creadas |
| 0.3 | Turborepo + pnpm workspaces + oxlint + Prettier + Vitest + Rolldown | `pnpm lint`, `pnpm build` pasan |
| 0.4 | Packages base: `@polaris/tsconfig`, `@polaris/build-config`, `shared-types`, `shared-utils`, `lambda-core` | Build exitoso |
| 0.5 | `infra/local/docker-compose.yml` (Postgres, Redis, Kafka + topics) | `docker compose up` healthy |
| 0.6 | Documentación: `arquitectura.md`, `roadmap.md` | Docs en `docs/` |

**Estado:** completada en este reset.

---

## Fase 1 — Dominio y persistencia local (5–7 días) ✅

**Objetivo:** modelo de datos y reglas de negocio sin AWS.

| # | Tarea | DoD |
|---|-------|-----|
| 1.1 | Crear `packages/domain` — entidades, value objects, eventos | Tests Vitest ≥ 80 % ✅ |
| 1.2 | Crear `packages/database` — TypeORM + migraciones | Migraciones corren en Postgres local ✅ |
| 1.3 | Seed: 10 plazas, 1 admin, 1 usuario test | Script `pnpm db:seed` ✅ |
| 1.4 | Crear `packages/kafka` — schemas de eventos, producer/consumer base | Publica/consume en Kafka local ✅ |
| 1.5 | Tests integración con testcontainers (Postgres, Redis, Kafka) | CI local verde ✅ |

**IaC:** ninguno.

**Estado:** completada.

**Comandos de inicio:**

```bash
docker compose -f infra/local/docker-compose.yml up -d
pnpm install
pnpm build
pnpm test
```

---

## Fase 2 — IaC base + MSK (5–7 días)

**Objetivo:** red, datos y **Amazon MSK** en dev.

### Convenciones IaC (Fase 2 en adelante)

Estas reglas aplican a **todos** los módulos en `iac/modules/` y a `iac/environments/*`:

1. **Sin `main.tf` monolíticos** — un archivo por responsabilidad, con el scope mínimo necesario. Los recursos se agrupan por dominio, no en un único bloque gigante.
2. **Archivos fijos por módulo** — `versions.tf`, `variables.tf`, `outputs.tf`, `locals.tf` (si aplica). El resto son archivos de recurso con nombre explícito.
3. **Ejemplos de layout por módulo:**

   ```
   iac/modules/cognito/
   ├── versions.tf
   ├── variables.tf
   ├── outputs.tf
   ├── locals.tf
   ├── user-pool.tf
   ├── app-client.tf
   └── domain.tf

   iac/modules/vpc/
   ├── versions.tf
   ├── variables.tf
   ├── outputs.tf
   ├── locals.tf
   ├── vpc.tf
   ├── subnets.tf
   ├── nat.tf
   └── endpoints.tf
   ```

4. **Módulo `iam` centralizado** — roles, policies y attachments viven en `iac/modules/iam/`, **no** dentro de `rds`, `kafka`, `ecs`, etc. Los demás módulos solo consumen ARNs/outputs del módulo IAM. Crece por fases (Fase 2: MSK, RDS, Secrets; Fase 3+: ECS task roles; Fase 5+: Lambda execution roles).
5. **Skills Terraform obligatorias** — al implementar o revisar cada módulo, usar las skills del repo: `terraform-style-guide`, `terraform-module-library`, `refactor-module` (y `terraform-stacks` si aplica).
6. **Sin comentarios en módulos** — el HCL en `iac/modules/*` debe ser autodocumentado (nombres de recursos, variables y archivos claros). Documentación en `README.md` del módulo, no en línea.
7. **Alineación con la arquitectura** — cada módulo debe reflejar [`arquitectura.md`](./arquitectura.md) (capas VPC, MSK, Cognito, etc.) y los flujos en [`flujos.md`](./flujos.md). No inventar recursos fuera del diseño acordado.

| # | Módulo Terraform | DoD |
|---|------------------|-----|
| 2.1 | `vpc` | 3-tier subnets, NAT, VPC endpoints |
| 2.2 | `security-groups` | SG sin dependencias circulares |
| 2.3 | **`iam`** | Roles/policies centralizados; MSK IAM auth, acceso RDS/Secrets (Fase 2) |
| 2.4 | `rds` | Aurora PostgreSQL Serverless v2 dev |
| 2.5 | `redis` | ElastiCache Serverless dev |
| 2.6 | **`kafka`** | **MSK 3 brokers, IAM auth, encryption** |
| 2.7 | `cognito` | User Pool + app client |
| 2.8 | `dynamodb` | 3 tablas planificadas |
| 2.9 | `s3` | Buckets audit, backups, assets |
| 2.10 | `secrets-manager` | Secret RDS + rotación |
| 2.11 | `environments/dev` | `terraform plan` sin errores |

| # | Tarea Kafka | DoD |
|---|-------------|-----|
| 2.12 | Lambda `kafka-topic-creator` (Node 24) o provisioner | 8 topics creados en MSK |
| 2.13 | Verificar conectividad IAM desde VPC | ✅ Lambda `kafka-msk-smoke` + `pnpm kafka:smoke:msk:dev` |

**Reglas críticas:**

- El módulo `security-groups` **no depende** de otros módulos de aplicación (evitar ciclo vpc ↔ ecs).
- Los módulos de servicio **no crean** `aws_iam_role` ni `aws_iam_policy`; delegan en `iam`.

---

## Fase 3 — API Service (vertical slice #1) (7–10 días)

**Objetivo:** primer flujo real — disponibilidad de plazas.

| # | Tarea | DoD |
|---|-------|-----|
| 3.1 | Scaffold `apps/api-service` — NestJS 11 + Fastify + ESM | ✅ `pnpm dev --filter api-service` · `curl localhost:3001/health` |
| 3.2 | Auth Cognito (signin/refresh/logout) — sin signup público | ✅ Tests Vitest + `pnpm test:integration:auth` contra User Pool dev |
| 3.3 | `GET /parking/availability` — Redis + fallback RDS | ✅ `pnpm test:integration:parking` |
| 3.4 | Dockerfile multi-stage + push ECR | ✅ `pnpm docker:build:api-service` + `pnpm docker:push:api-service:dev` |
| 3.5 | IaC: `ecr` + `ecs` — **solo api-service** (1 servicio) | ✅ `curl ALB/health` verde |
| 3.6 | IaC: `api-gateway` — HTTP API público, rutas auth + parking | ✅ `curl API_GW/health` + `/parking/availability` |

**No desplegar** event-processor, reservation, admin hasta Fase 4–5.

---

## Fase 4 — Reservas + Kafka producers (5–7 días)

| # | Tarea | DoD |
|---|-------|-----|
| 4.1 | Scaffold `apps/reservation-service` | ✅ `pnpm dev --filter reservation-service` · `curl localhost:3002/health` |
| 4.2 | `POST /parking/reserve`, `DELETE /parking/reserve/{id}` | ✅ Lock Redis, persist RDS · `pnpm test:integration:reservation` |
| 4.3 | Publicar `reservation.created` / `reservation.cancelled` a **MSK** | ✅ `pnpm test:integration:kafka` |
| 4.4 | IaC: desplegar reservation-service en ECS | ✅ 2 tasks dev · `pnpm docker:push:reservation-service:dev` + `terraform apply` |
| 4.5 | API Gateway: rutas de reserva | ✅ JWT Cognito · E2E `POST/DELETE /parking/reserve` vía API GW |

---

## Fase 5 — Event processor + Lambdas core (7–10 días)

| # | Tarea | DoD |
|---|-------|-----|
| 5.1 | Scaffold `apps/event-processor-service` — consumidor KafkaJS + IAM | ✅ `pnpm dev --filter event-processor-service` · `pnpm test:integration:kafka-consumer` |
| 5.2 | Handlers: `vehicle.entry`, `vehicle.exit`, `sensor.occupancy` | ✅ Redis + RDS actualizados · `pnpm test:integration:handlers` |
| 5.3 | Publicar a EventBridge tras procesar eventos | ✅ Regla dispara target · `pnpm test:integration:eventbridge` |
| 5.4 | `lambdas/rfid-validator` — Rolldown + Node 24 + `@polaris/lambda-core` | ✅ Deploy dev · `pnpm rfid-validator:smoke:dev` |
| 5.5 | `lambdas/audit-logger` | ✅ Logs + S3 · `pnpm audit-logger:smoke:dev` |
| 5.6 | IaC: `lambda`, `eventbridge`, `sqs` | ✅ Triggers activos · `pnpm eventbridge:smoke:dev` |
| 5.7 | IaC: desplegar event-processor en ECS | ✅ Consumer group estable · `pnpm event-processor:smoke:dev` |

---

## Fase 6 — Admin + IoT (7–10 días)

| # | Tarea | DoD |
|---|-------|-----|
| 6.1 | Scaffold `apps/admin-service` | ✅ CRUD usuarios admin · `pnpm test:integration:users` |
| 6.2 | `GET /admin/audit`, `GET /admin/metrics` | ✅ Paginación + filtros · `pnpm test:integration:audit` · `pnpm test:integration:metrics` |
| 6.3 | IaC: `iot-core` — topics, rules, policies, certificados | ✅ Dispositivo simulado publica MQTT · `pnpm iot:smoke:dev` |
| 6.4 | `lambdas/sensor-data-processor` | ✅ IoT → DynamoDB + Kafka · `pnpm sensor-data-processor:smoke:dev` |
| 6.5 | `lambdas/notification-sender`, `reservation-cleanup`, `health-checker` | ✅ Schedules EventBridge · `pnpm scheduled-lambdas:smoke:dev` |
| 6.6 | API Gateway privado — rutas admin + internal | ✅ HTTP API v2 + VPC Link → ALB + `admin-service` ECS · VPC tuning Lambdas · `pnpm api-gateway-private:smoke:dev` |

---

## Fase 7 — Tiempo real + frontends (10–14 días)

| # | Tarea | DoD |
|---|-------|-----|
| 7.1 | IaC: `appsync` — schema GraphQL + resolvers | Query availability |
| 7.2 | Subscriptions tiempo real | `onOccupancyChanged` funciona |
| 7.3 | `apps/web-admin` — Next.js + AppSync | Dashboard ocupación |
| 7.4 | `apps/mobile` — Expo + AppSync | Reserva desde móvil |

---

## Fase 8 — CI/CD + observabilidad (5–7 días)

| # | Tarea | DoD |
|---|-------|-----|
| 8.1 | `.github/workflows/ci.yml` — turbo lint, test, build | PR checks verdes |
| 8.2 | `.github/workflows/deploy-dev.yml` | Deploy automático post-merge |
| 8.3 | IaC: `observability` — dashboards, alarmas, X-Ray | Alarmas SNS configuradas |
| 8.4 | Cobertura Vitest ≥ 80 % en packages + apps | Reporte coverage |

---

## Fase 9 — Perímetro y prod (5–7 días)

| # | Tarea | DoD |
|---|-------|-----|
| 9.1 | IaC: `edge` — Route53, CloudFront, WAF | Solo staging/prod |
| 9.2 | `environments/staging` + `environments/prod` | Plans independientes |
| 9.3 | MSK prod: brokers `kafka.m5.xlarge`, RF=3 | Documentado en tfvars |
| 9.4 | Load tests k6 — 1000 usuarios concurrentes | Reporte latencia p95 |

---

## Fase 10 — Firmware ESP32 (paralelo desde Fase 6)

| # | Tarea | DoD |
|---|-------|-----|
| 10.1 | PlatformIO scaffold `firmware/esp32/` | Compila |
| 10.2 | WiFi + MQTT TLS → IoT Core | Mensaje en CloudWatch |
| 10.3 | RFID RC522 + sensores IR + servo + LCD | Flujo ingreso vehículo |

---

## Orden resumido

```
Fase 0  ✅ Fundación monorepo
Fase 1  ✅  Dominio + DB + Kafka local
Fase 2     IaC: VPC, SG, IAM, RDS, Redis, MSK, Cognito, DynamoDB, S3
Fase 3  ▶  api-service + ECS + API Gateway (slice #1) — 3.1 ✅
Fase 4  ▶  reservation-service + Kafka producers — 4.1 ✅ … 4.5 ✅
Fase 5     event-processor + Lambdas + EventBridge
Fase 6     admin-service + IoT Core
Fase 7     AppSync + frontends
Fase 8     CI/CD + observabilidad
Fase 9     Edge + prod
Fase 10    Firmware ESP32
```

**Estimación total:** 55–75 días de desarrollo.

---

## Métricas de progreso

| Métrica | Ahora | Meta Fase 3 |
|---------|-------|-------------|
| Servicios NestJS | 0/4 | 1/4 |
| Lambdas Node 24 | 0/8 | 0/8 |
| Módulos Terraform | 1 (bootstrap) | 10+ |
| Topics MSK en dev | 0 | 8 |
| Vertical slice E2E | No | GET availability vía API GW |

---

## Próxima acción inmediata

**Iniciar Fase 2.1:** módulo `iac/modules/vpc` (archivos por responsabilidad, sin comentarios en HCL).

```bash
cd iac/environments/dev   # tras crear el entorno
terraform init
terraform plan
```
