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

| Variable                               | dev               | staging            | prod               |
| -------------------------------------- | ----------------- | ------------------ | ------------------ |
| `vpc_cidr`                             | `10.0.0.0/16`     | igual              | igual              |
| `azs`                                  | 3 AZ us-east-2    | igual              | igual              |
| `enable_nat_gateway`                   | `true`            | `true`             | `true`             |
| `single_nat_gateway`                   | `true`            | `true`             | `false`            |
| `enable_vpc_endpoints`                 | `true`            | `true`             | `true`             |
| `rds_capacity_mode`                    | `serverless`      | `provisioned`      | `provisioned`      |
| `rds_serverless_min_capacity`          | `0.5`             | —                  | —                  |
| `rds_serverless_max_capacity`          | `2`               | —                  | —                  |
| `rds_reader_count`                     | `null` (0)        | `1`                | `2`                |
| `rds_writer_instance_class`            | `null`            | `db.t4g.medium`    | `db.r6g.xlarge`    |
| `redis_capacity_mode`                  | `serverless`      | `provisioned`      | `provisioned`      |
| `redis_num_shards`                     | —                 | `2`                | `3`                |
| `redis_node_type`                      | —                 | `cache.t4g.medium` | `cache.r7g.xlarge` |
| `kafka_broker_instance_type`           | `kafka.m5.large`  | `kafka.m5.large`   | `kafka.m5.xlarge`  |
| `kafka_log_retention_hours`            | `168`             | `168`              | `336`              |
| `cognito_mfa_configuration`            | `OFF`             | `OPTIONAL`         | `OPTIONAL`         |
| `cognito_admin_create_user_only`       | `true`            | `true`             | `true`             |
| `dynamodb_billing_mode`                | `PAY_PER_REQUEST` | `PROVISIONED`      | `PROVISIONED`      |
| `s3_lifecycle_glacier_transition_days` | `90`              | `90`               | `90`               |
| `secrets_manager_rds_rotation_days`    | `30`              | `30`               | `30`               |

Plantillas de referencia: `dev.tfvars.example`, `staging.tfvars.example`,
`prod.tfvars.example`.

## Módulos desplegados

| Fase | Módulo                      | Estado |
| ---- | --------------------------- | ------ |
| 2.1  | `vpc`                       | ✅     |
| 2.2  | `security-groups`           | ✅     |
| 2.3  | `iam`                       | ✅     |
| 2.4  | `rds`                       | ✅     |
| 2.5  | `redis`                     | ✅     |
| 2.6  | `kafka`                     | ✅     |
| 2.7  | `cognito`                   | ✅     |
| 2.8  | `dynamodb`                  | ✅     |
| 2.9  | `s3`                        | ✅     |
| 2.10 | `secrets-manager`           | ✅     |
| 2.12 | `kafka-topic-creator`       | ✅     |
| 2.13 | `kafka-msk-smoke`           | ✅     |
| 3.5  | `ecr` + `ecs` (api-service) | ✅     |
| 3.6  | `api-gateway`               | ✅     |
| 4.5  | `api-gateway` reservas      | ✅     |
| 4.4  | `ecs` (reservation)         | ✅     |

Los repos ECR viven en un solo archivo: `ecr.tf` (`ecr_api_service`,
`ecr_reservation_service`).

## Recrear infra desde cero

Tras `terraform destroy` + `terraform apply`:

1. **Imágenes Docker** — Terraform no hace push; ejecutar:
   `pnpm docker:push:api-service:dev` y
   `pnpm docker:push:reservation-service:dev`
2. **Secrets ECS** — si falla _scheduled for deletion_, ver sección abajo.
3. **Datos** — `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:sync-redis` contra
   Aurora/Redis dev.
4. **Cognito** — recrear usuario de prueba (CLI en sección E2E).

### Reset dev (BD vacía + seed + Redis)

Tras errores parciales (p. ej. CROSSSLOT en reservas) o datos inconsistentes:

**GitHub Actions (recomendado):** repo → **Actions** → **DB reset dev** → **Run
workflow** → en `confirm` escribe exactamente `reset-dev`.

Alternativa local:

```bash
pnpm db:reset:dev
SKIP_PUSH=1 pnpm db:reset:dev   # solo task ECS (imagen :latest ya en ECR)
```

Qué hace la task `node dist/reset.js`:

1. `TRUNCATE` tablas de app (usuarios, plazas, reservas, audit, sensores)
2. Seed (`usr-admin01`, `usr-12345`, 10 plazas `free`)
3. Borra claves Redis `{parking}:*` y legacy `parking:*`
4. `syncParkingRedis` desde RDS

**No borra** usuarios de Cognito.

### Secrets Manager: scheduled for deletion

Si `terraform apply` falla al crear `polaris-dev-*-service-env`:

```bash
# Opción A: restaurar y aplicar de nuevo
aws secretsmanager restore-secret --secret-id polaris-dev-api-service-env --region us-east-2
aws secretsmanager restore-secret --secret-id polaris-dev-reservation-service-env --region us-east-2

# Opción B: borrado inmediato (dev)
aws secretsmanager delete-secret --secret-id polaris-dev-api-service-env --force-delete-without-recovery --region us-east-2
aws secretsmanager delete-secret --secret-id polaris-dev-reservation-service-env --force-delete-without-recovery --region us-east-2
```

En dev el módulo ECS usa `recovery_window_in_days = 0` para evitar este bloqueo
en futuros destroy/apply.

## ECR (import opcional)

Si los repos ya existen (p. ej. creados por los scripts de push antes del
apply):

```bash
cd iac/environments/dev
terraform import 'module.ecr_api_service.aws_ecr_repository.service' polaris-dev-api-service
terraform import 'module.ecr_reservation_service.aws_ecr_repository.service' polaris-dev-reservation-service
```

Build y push:

```bash
pnpm docker:push:api-service:dev
pnpm docker:push:reservation-service:dev
```

## ECS reservation-service (4.4)

```bash
aws ecs describe-services \
  --cluster "$(terraform output -raw api_service_ecs_cluster_name)" \
  --services "$(terraform output -raw reservation_service_ecs_service_name)" \
  --region us-east-2 \
  --query 'services[0].{desired:desiredCount,running:runningCount}'
```

Desde VPC (con `alb_ingress_cidr_blocks`):

```bash
ALB=$(terraform output -raw api_service_alb_dns_name)
curl -s -X POST "http://${ALB}/parking/reserve" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: usr-12345" \
  -d '{"parkingSpotId":"spot-07","reservationDate":"2025-06-19T14:00:00.000Z"}'
```

Tras cambiar el secret de reservation-service, redeploy:

```bash
aws ecs update-service --cluster polaris-dev-cluster \
  --service polaris-dev-reservation-service --force-new-deployment --region us-east-2
```

## ECS api-service (3.5)

1. Asegurar imagen en ECR (`pnpm docker:push:api-service:dev`).

2. Aplicar:

```bash
cd iac/environments/dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

3. Health check (vía API Gateway — el ALB es interno):

```bash
API=$(terraform output -raw api_gateway_endpoint)
curl -s "${API}health"
curl -s "${API}parking/availability"
```

## API Gateway (3.6 + 4.5)

Tras `terraform apply`:

```bash
API=$(terraform output -raw api_gateway_endpoint)
curl -s "${API}health"
curl -s "${API}parking/availability"
```

### Reservas E2E (4.5)

Requiere `preferred_username` en Cognito (mapea a `usr-*` del seed). Usar
**idToken**:

```bash
POOL=$(terraform output -raw cognito_user_pool_id)

aws cognito-idp admin-update-user-attributes \
  --user-pool-id "$POOL" \
  --username "juan@example.com" \
  --user-attributes Name=preferred_username,Value=usr-12345 \
  --region us-east-2

TOKEN=$(curl -s -X POST "${API}auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"YOUR_PASSWORD"}' \
  | jq -r .idToken)

curl -s -X POST "${API}parking/reserve" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"parkingSpotId":"spot-07","reservationDate":"2025-06-19T14:00:00.000Z"}'
```

Entrada pública recomendada: `api_gateway_endpoint`. Opcionalmente restringir el
ALB al CIDR de la VPC en `alb_ingress_cidr_blocks` (p. ej. `["10.0.0.0/16"]`).

**Prerequisitos datos (primera vez):** migraciones y seed contra Aurora dev,
luego opcional `pnpm db:sync-redis` con `DATABASE_URL`/`REDIS_URL` de dev
apuntando a AWS.

Tras cambiar el secret de aplicación, forzar redeploy ECS:

```bash
aws ecs update-service --cluster polaris-dev-cluster \
  --service polaris-dev-api-service --force-new-deployment --region us-east-2
```

## API Gateway privado (6.6)

Solo invocable desde la VPC vía endpoint `execute-api`. Reutiliza el VPC Link v2
del API público → ALB interno.

```bash
pnpm docker:push:admin-service:dev
pnpm --filter @polaris/api-gateway-private-smoke build
terraform apply -var-file=dev.tfvars
pnpm api-gateway-private:smoke:dev
```

Output útil: `api_gateway_private_endpoint` (hostname
`{api-id}-{vpce-id}.execute-api...`).

pnpm api-gateway-private:smoke:dev

````

## AppSync (7.1–7.2)

GraphQL con auth Cognito (+ API key para smoke). `Query.availability` vía Lambda
Redis/RDS. `onOccupancyChanged` subscription alimentada por EventBridge →
`appsync-occupancy-publisher`.

```bash
pnpm --filter @polaris/appsync-availability build
pnpm --filter @polaris/appsync-occupancy-publisher build
terraform apply -var-file=dev.tfvars
pnpm appsync:smoke:dev
pnpm appsync:subscription:smoke:dev
```

## Web admin + mobile (dev AWS, sin local backend)

APIs en `execute-api` (dev no tiene módulo `edge`). Tras `terraform apply` con CORS
y throttling corregidos:

```bash
# Regenerar env desde Terraform
pnpm web-admin:env:dev    # ADMIN_API_URL → api_gateway_private_endpoint
pnpm mobile:env:dev       # EXPO_PUBLIC_API_URL → api_gateway_endpoint

# Web: UI en localhost, datos en AWS
pnpm --filter web-admin dev   # http://localhost:3000

# Móvil: bundler local, APIs en AWS
pnpm mobile:dev
```

Usuario admin: credenciales del `db-bootstrap` (Cognito grupo `admin`).

### 429 Too Many Requests en `/health`

El stage HTTP API tenía `ThrottlingRateLimit=0` (default del provider Terraform) →
bloquea **todo** el tráfico. Fix en `iac/modules/api-gateway*/api.tf`:
`throttling_burst_limit=5000`, `throttling_rate_limit=10000`.

Hotfix inmediato (sin apply) para **cada** HTTP API (pública + admin):

```bash
aws apigatewayv2 update-stage --api-id <API_ID> --stage-name '$default' \
  --region us-east-2 \
  --default-route-settings '{"ThrottlingBurstLimit":5000,"ThrottlingRateLimit":10000,"DetailedMetricsEnabled":true}'
```

### CORS en web-admin local (`OPTIONS` → 401)

Si el navegador bloquea `/admin/*` con *preflight doesn't pass access control check*,
la ruta `ANY /admin/{proxy+}` con JWT estaba capturando `OPTIONS` (sin `Authorization`)
antes de que API Gateway respondiera CORS.

Fix en `iac/modules/api-gateway-private/routes-admin.tf`: rutas por método
(`GET`, `POST`, …) sin `ANY`. Tras el cambio:

```bash
cd iac/environments/dev
terraform apply -var-file=dev.tfvars
```

Verificación rápida (debe devolver **204** o **200**, no 401):

```bash
curl -sS -D - -o /dev/null -X OPTIONS \
  "$(terraform output -raw api_gateway_private_endpoint)/admin/metrics" \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization'
```

## Smoke test MSK (2.13)

Tras `terraform apply`:

```bash
pnpm --filter @polaris/kafka-msk-smoke build
pnpm kafka:smoke:msk:dev
```

## IoT Core — 4 ESP32 (Fase 10, solo dev)

`iot-core.tf` provisiona 4 Things alineados con el firmware PlatformIO:

| Clave Terraform | `deviceId`     | Rol        |
| --------------- | -------------- | ---------- |
| `entry-io-01`   | `entry-io-01`  | 2× RFID + LCD + HC-SR04 |
| `actuators-01`  | `actuators-01` | Servos + FC-51 ×10 |
| `leds-zone-a`   | `leds-zone-a`  | RGB plazas 1–5 |
| `leds-zone-b`   | `leds-zone-b`  | RGB plazas 6–10 |

Tras `terraform apply` (incluye `iot-moved.tf` para renombrar Things legacy sin
rotar certificados):

```bash
terraform output -json iot_device_thing_names
terraform output -json iot_device_ids
terraform output -json iot_device_certificate_pems   # sensitive
terraform output -json iot_device_private_keys     # sensitive

cd firmware/esp32
./scripts/write-config-from-terraform.sh actuators-01
```

Prod/staging siguen con un solo dispositivo (`entry-gate-01`) hasta activar los 4
allí.
````
