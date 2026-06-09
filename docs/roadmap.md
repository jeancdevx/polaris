# Roadmap de Implementación - Polaris Parking System

## Fase 1: Setup Inicial del Proyecto

### Paso 1.1 - Inicialización del monorepo con pnpm

- Crear directorio raíz: `mkdir polaris && cd polaris`
- Inicializar pnpm workspace: `pnpm init`
- Crear `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - 'services/backend/*'
    - 'services/lambdas/*'
    - 'apps/*'
    - 'packages/*'
    - 'iac/**'
    - 'firmware/*'
  ```
- Crear `.npmrc`:
  ```
  # Configuración ideal y segura
  strict-peer-dependencies=true
  auto-install-peers=false
  # Elimina por completo la línea de shamefully-hoist
  ```

### Paso 1.2 - Configuración de TypeScript base

- Crear `tsconfig.base.json` con configuración compartida (target ES2022, strict
  mode, decorators)
- Crear `tsconfig.json` raíz que extiende el base con paths alias `@polaris/*`

### Paso 1.3 - Configuración de Prettier

- Instalar: `pnpm add -Dw prettier`
- Crear `.prettierrc` (semi, trailingComma all, singleQuote, printWidth 100)
- Crear `.prettierignore` (node_modules, dist, .terraform, coverage)
- Scripts: `format`, `format:check`

### Paso 1.4 - Configuración de ESLint

- Instalar:
  `pnpm add -Dw eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier`
- Crear `eslint.config.js` (flat config)
- Scripts: `lint`, `lint:fix`

### Paso 1.5 - Configuración de Vitest

- Instalar: `pnpm add -Dw vitest @vitest/coverage-v8`
- Crear `vitest.config.ts`
- Scripts: `test`, `test:coverage`, `test:ui`

### Paso 1.6 - Configuración de Husky y lint-staged

- Instalar: `pnpm add -Dw husky lint-staged`
- Inicializar: `pnpm husky init`
- Crear `.husky/pre-commit` con lint-staged
- Configurar lint-staged en package.json

### Paso 1.7 - Configuración de commitlint

- Instalar: `pnpm add -Dw @commitlint/cli @commitlint/config-conventional`
- Crear `commitlint.config.js` (conventional commits)
- Crear `.husky/commit-msg`

### Paso 1.8 - Crear estructura de carpetas base

```bash
mkdir -p iac/{bootstrap,environments/{dev,staging,prod},modules/{vpc,ecs,rds,redis,kafka,lambda,api-gateway,cognito,appsync,iot-core,s3,dynamodb}}
mkdir -p services/backend/{api-service,event-processor-service,reservation-service,admin-service}
mkdir -p services/lambdas/{sensor-data-processor,rfid-validator,notification-sender,occupancy-aggregator,audit-logger,reservation-cleanup,daily-report-generator,health-checker}
mkdir -p apps/{web-admin,mobile-app}
mkdir -p packages/{shared-types,shared-utils,eslint-config,tsconfig}
mkdir -p firmware/esp32
mkdir -p scripts
mkdir -p .github/workflows
mkdir -p docs
```

### Paso 1.9 - Crear package.json para cada workspace

- Para cada servicio en `services/backend/`: NestJS con scripts
  dev/build/test/lint
- Para cada lambda en `services/lambdas/`: esbuild con scripts build/test/lint
- Para apps: Next.js para web-admin, React Native/Expo para mobile-app

### Paso 1.10 - Instalar dependencias del workspace

- Ejecutar `pnpm install`
- Verificar workspaces: `pnpm list -r --depth 0`

---

## Fase 2: Infraestructura como Código (IaC)

### Paso 2.1 - Setup de Terraform bootstrap

- Crear `iac/bootstrap/versions.tf` con required_version y required_providers
- Crear `iac/bootstrap/backend.tf` con configuración del backend S3
- Crear `iac/bootstrap/variables.tf` con variables del bootstrap
- Crear `iac/bootstrap/locals.tf` con valores locales
- Crear `iac/bootstrap/s3.tf` para bucket de estado de Terraform
- Crear `iac/bootstrap/dynamodb.tf` para tabla de locks
- Crear `iac/bootstrap/outputs.tf` con outputs del bootstrap
- Ejecutar: `cd iac/bootstrap && terraform init && terraform apply`

### Paso 2.2 - Crear módulos base de Terraform (estructura granular por recurso)

Cada módulo debe tener archivos separados por responsabilidad, NO un monolito
main.tf:

**Módulo VPC (`iac/modules/vpc/`):**

- `versions.tf` - required_providers
- `variables.tf` - variables del módulo (vpc_cidr, azs, subnet_cidrs, etc.)
- `locals.tf` - valores locales y tags
- `vpc.tf` - recurso aws_vpc
- `subnets.tf` - recursos aws_subnet (public, private, data)
- `igw.tf` - internet gateway
- `nat.tf` - NAT gateways (uno por AZ)
- `route_tables.tf` - route tables y asociaciones
- `vpc_endpoints.tf` - VPC endpoints para servicios AWS
- `security_groups.tf` - security groups base
- `outputs.tf` - outputs del módulo (vpc_id, subnet_ids, etc.)

**Módulo ECS (`iac/modules/ecs/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `cluster.tf` - aws_ecs_cluster
- `service.tf` - aws_ecs_service
- `task_definition.tf` - aws_ecs_task_definition
- `autoscaling.tf` - auto-scaling policies
- `alb.tf` - application load balancer
- `target_groups.tf` - target groups
- `security_groups.tf`
- `outputs.tf`

**Módulo RDS (`iac/modules/rds/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `rds.tf` - aws_db_instance (Multi-AZ)
- `subnet_group.tf` - aws_db_subnet_group
- `parameter_group.tf` - aws_db_parameter_group
- `security_groups.tf`
- `outputs.tf`

**Módulo Redis (`iac/modules/redis/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `redis.tf` - aws_elasticache_cluster o aws_elasticache_replication_group
- `subnet_group.tf`
- `parameter_group.tf`
- `security_groups.tf`
- `outputs.tf`

**Módulo Kafka (`iac/modules/kafka/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `msk_cluster.tf` - aws_msk_cluster
- `configuration.tf` - aws_msk_configuration
- `security_groups.tf`
- `outputs.tf`

**Módulo Lambda (`iac/modules/lambda/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `lambda.tf` - aws_lambda_function
- `iam.tf` - IAM role y policies
- `log_group.tf` - CloudWatch log group
- `outputs.tf`

**Módulo API Gateway (`iac/modules/api-gateway/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `api.tf` - aws_apigatewayv2_api
- `stages.tf` - aws_apigatewayv2_stage
- `routes.tf` - aws_apigatewayv2_route
- `integrations.tf` - aws_apigatewayv2_integration
- `authorizers.tf` - aws_apigatewayv2_authorizer
- `vpc_link.tf` - VPC link para API privado
- `outputs.tf`

**Módulo Cognito (`iac/modules/cognito/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `user_pool.tf` - aws_cognito_user_pool
- `user_pool_client.tf` - aws_cognito_user_pool_client
- `user_pool_domain.tf`
- `outputs.tf`

**Módulo AppSync (`iac/modules/appsync/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `graphql_api.tf` - aws_appsync_graphql_api
- `data_sources.tf` - aws_appsync_datasource
- `resolvers.tf` - aws_appsync_resolver
- `schema.tf` - schema GraphQL
- `outputs.tf`

**Módulo IoT Core (`iac/modules/iot-core/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `iot_topic_rule.tf` - aws_iot_topic_rule
- `iot_policy.tf` - aws_iot_policy
- `outputs.tf`

**Módulo S3 (`iac/modules/s3/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `bucket.tf` - aws_s3_bucket
- `versioning.tf` - aws_s3_bucket_versioning
- `encryption.tf` - aws_s3_bucket_server_side_encryption_configuration
- `lifecycle.tf` - aws_s3_bucket_lifecycle_configuration
- `public_access.tf` - aws_s3_bucket_public_access_block
- `outputs.tf`

**Módulo DynamoDB (`iac/modules/dynamodb/`):**

- `versions.tf`
- `variables.tf`
- `locals.tf`
- `dynamodb.tf` - aws_dynamodb_table
- `outputs.tf`

### Paso 2.3 - Crear configuración de ambientes

- `iac/environments/dev/main.tf` y `terraform.tfvars`
- `iac/environments/dev/backend.tf` con configuración S3
- Repetir para staging y prod

### Paso 2.4 - Desplegar VPC y networking en dev

- Navegar a `iac/environments/dev`
- `terraform init && terraform plan -out=tfplan && terraform apply tfplan`
- Verificar VPC, subnets, IGW, NAT Gateways, VPC Endpoints

### Paso 2.5 - Desplegar RDS PostgreSQL en dev

- Agregar módulo RDS en main.tf
- Crear variable db_password
- `terraform apply`
- Conectar y crear esquema inicial (users, reservations, parking_spots,
  audit_logs)

### Paso 2.6 - Desplegar ElastiCache Redis en dev

- Agregar módulo Redis (3 shards, cluster mode)
- `terraform apply`
- Crear keys iniciales en Redis

### Paso 2.7 - Desplegar DynamoDB en dev

- Crear tablas: RFIDValidations, SensorReadings, WebSocketConnections
- `terraform apply`

### Paso 2.8 - Desplegar MSK Kafka en dev

- Agregar módulo Kafka (3 brokers)
- `terraform apply`
- Crear topics: vehicle.entry, vehicle.exit, sensor.occupancy, sensor.proximity,
  reservation.created, reservation.cancelled, rfid.validation, audit.events

### Paso 2.9 - Desplegar Cognito en dev

- Agregar módulo Cognito con User Pool
- Configurar schemas: email, name, custom:vehicle_plate
- `terraform apply`
- Crear usuario admin

### Paso 2.10 - Desplegar S3 buckets en dev

- Crear buckets: polaris-audit-logs-dev, polaris-backups-dev, polaris-assets-dev
- Configurar versioning y lifecycle policies
- `terraform apply`

---

## Fase 3: Servicios Backend (NestJS)

### Paso 3.1 - Scaffold de API Service

- `cd services/backend/api-service && nest new . --package-manager pnpm --skip-git`
- Instalar: @nestjs/config, @nestjs/typeorm, typeorm, pg, @nestjs/jwt,
  @nestjs/passport, passport-jwt, class-validator, class-transformer
- Generar módulos: auth, parking, user, reservation
- Configurar TypeORM con conexión a RDS
- Configurar JWT strategy

### Paso 3.2 - Implementar endpoints de autenticación

- `POST /auth/signup` - Crear usuario en Cognito + RDS
- `POST /auth/signin` - Validar contra Cognito, retornar JWT tokens
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Invalidar token en Cognito
- Agregar JWT guards en endpoints protegidos

### Paso 3.3 - Implementar endpoints de parking

- `GET /parking/availability` - Consultar Redis, retornar estado en tiempo real
- `GET /parking/spots/:id` - Estado específico de una plaza
- Agregar caché (30s) en availability

### Paso 3.4 - Implementar endpoints de reservation

- `POST /parking/reserve` - Lock Redis, validar, crear en RDS, actualizar Redis,
  Kafka event
- `DELETE /parking/reserve/:id` - Cancelar reserva
- `GET /user/reservations` - Listar reservas del usuario

### Paso 3.5 - Implementar endpoints de user

- `GET /user/profile` - Datos del usuario autenticado
- `PUT /user/profile` - Actualizar datos

### Paso 3.6 - Scaffold de Event Processor Service

- `cd services/backend/event-processor-service && nest new . --package-manager pnpm --skip-git`
- Instalar: kafkajs, ioredis, @aws-sdk/client-eventbridge, @aws-sdk/client-s3
- Crear módulo kafka-consumer
- Crear módulo event-handler

### Paso 3.7 - Implementar handlers de eventos

- Handler `vehicle.entry`: Actualizar Redis, RDS, publicar EventBridge
- Handler `vehicle.exit`: Liberar plaza, actualizar contadores, auditoría
- Handler `sensor.occupancy`: Detectar anomalías
- Handler `reservation.created`: Loggear y métricas

### Paso 3.8 - Scaffold de Reservation Service

- `cd services/backend/reservation-service && nest new . --package-manager pnpm --skip-git`
- Instalar dependencias
- Implementar validación y creación de reservas
- Implementar limpieza de reservas expiradas (job cada 5 min)

### Paso 3.9 - Scaffold de Admin Service

- `cd services/backend/admin-service && nest new . --package-manager pnpm --skip-git`
- Instalar: @aws-sdk/client-cognito-identity-provider, @aws-sdk/client-dynamodb,
  @aws-sdk/client-athena
- Crear módulos: user-management, audit, metrics

### Paso 3.10 - Implementar endpoints de admin

- `POST /admin/users` - Crear en Cognito + RDS + DynamoDB RFID
- `PUT /admin/users/:id` - Actualizar datos
- `DELETE /admin/users/:id` - Soft delete + desactivar RFID + Cognito
- `GET /admin/audit` - Consultar audit_logs con filtros y paginación
- `GET /admin/metrics` - Métricas en tiempo real e históricas

### Paso 3.11 - Crear Dockerfiles

- Crear Dockerfile multi-stage para cada servicio
- Crear .dockerignore

### Paso 3.12 - Crear docker-compose para desarrollo local

- PostgreSQL, Redis, Kafka
- Servicios NestJS
- Variables de entorno

---

## Fase 4: Lambda Functions

### Paso 4.1 - Configurar monorepo para lambdas

- Crear `services/lambdas/package.json` con workspaces
- Crear `services/lambdas/tsconfig.base.json`
- Crear `services/lambdas/esbuild.config.js` para builds optimizados

### Paso 4.2 - Implementar Lambda rfid-validator

- Consultar DynamoDB para validar RFID
- HTTP call a API Gateway privado para validar reserva
- Publicar comandos MQTT para servo y LCD
- Publicar evento a Kafka

### Paso 4.3 - Implementar Lambda audit-logger

- Escribir en CloudWatch Logs
- Archivar en S3

### Paso 4.4 - Implementar Lambda notification-sender

- Consultar device_token en DynamoDB
- Enviar push vía FCM
- Dead letter queue para fallos

### Paso 4.5 - Implementar Lambda reservation-cleanup

- Query RDS para reservas expiradas
- Cancelar y liberar plazas
- Notificar usuarios

### Paso 4.6 - Implementar Lambda sensor-data-processor

- Procesar datos de sensores
- Métricas CloudWatch
- Almacenar en DynamoDB

### Paso 4.7 - Implementar Lambda occupancy-aggregator

- Agregar ocupación por zona
- Actualizar Redis

### Paso 4.8 - Implementar Lambda daily-report-generator

- Generar reporte diario
- Subir a S3
- Enviar email vía SES

### Paso 4.9 - Implementar Lambda health-checker

- Health check a todos los servicios
- Alertas SNS si hay fallos

### Paso 4.10 - Crear script de deploy

- `scripts/deploy-lambdas.sh` para build y deploy automático

---

## Fase 5: API Gateway y AppSync

### Paso 5.1 - Desplegar API Gateway Público

- Configurar endpoints: /auth/_, /parking/_, /user/\*
- Authorizer de Cognito
- Throttling y caching

### Paso 5.2 - Desplegar API Gateway Privado

- Configurar endpoints internos
- VPC Endpoint
- Resource policy para acceso desde VPC

### Paso 5.3 - Desplegar AppSync GraphQL API

- Crear schema.graphql
- Configurar data sources (Redis, RDS)
- Crear resolvers
- Configurar suscripciones en tiempo real

---

## Fase 6: IoT Core y Firmware ESP32

### Paso 6.1 - Desplegar IoT Core

- Configurar topics y rules
- Crear políticas para dispositivos
- Generar certificados X.509

### Paso 6.2 - Crear estructura firmware ESP32

- Configurar PlatformIO
- Crear platformio.ini

### Paso 6.3 - Implementar módulo WiFi y MQTT

- Conexión WiFi con reconexión automática
- Cliente MQTT con buffer de pendientes

### Paso 6.4 - Implementar módulo RFID

- Lectura de tags RC522
- Publicar UID a MQTT

### Paso 6.5 - Implementar módulo sensores infrarrojos

- Lectura de 10 sensores
- Detección de cambios de estado
- Publicar a MQTT

### Paso 6.6 - Implementar módulo sensor ultrasónico

- Medición de distancia
- Detección de proximidad

### Paso 6.7 - Implementar módulo servomotores

- Control de apertura/cierre
- Timer de cierre automático
- Suscripción a comandos MQTT

### Paso 6.8 - Implementar módulo LCD I2C

- Mostrar mensajes
- Control de backlight
- Suscripción a comandos MQTT

### Paso 6.9 - Implementar módulo LEDs

- Indicadores de estado
- Parpadeo para actividad

### Paso 6.10 - Integrar módulos en main.cpp

- Setup y loop principal
- Inicialización de todos los módulos

### Paso 6.11 - Configurar certificados

- Descargar root CA
- Configurar certificados por dispositivo

### Paso 6.12 - Compilar y flashear

- `pio run -e esp32dev --target upload`
- Verificar conexión y publicación

---

## Fase 7: Aplicaciones Frontend

### Paso 7.1 - Scaffold Web App Admin

- Crear proyecto Next.js con TypeScript y Tailwind
- Configurar Apollo Client

### Paso 7.2 - Implementar autenticación Web Admin

- Login con Cognito
- Almacenamiento de tokens
- Middleware de autenticación

### Paso 7.3 - Implementar dashboard principal

- Suscripción GraphQL en tiempo real
- Métricas y gráficos
- Mapa visual del estacionamiento

### Paso 7.4 - Implementar gestión de usuarios

- Tabla de usuarios
- Modal de creación
- Acciones editar/desactivar

### Paso 7.5 - Implementar consulta de auditoría

- Filtros y paginación
- Exportar a CSV

### Paso 7.6 - Scaffold Mobile App

- Crear proyecto React Native con Expo
- Configurar Apollo Client
- Configurar notificaciones push

### Paso 7.7 - Implementar autenticación Mobile

- Login y registro
- AsyncStorage para tokens

### Paso 7.8 - Implementar pantalla de disponibilidad

- Suscripción en tiempo real
- Lista de plazas libres

### Paso 7.9 - Implementar flujo de reserva

- Selección de plaza
- Confirmación de reserva
- Lista de mis reservas

### Paso 7.10 - Implementar notificaciones push

- Permisos y registro de token
- Manejo de notificaciones recibidas

### Paso 7.11 - Implementar perfil de usuario

- Ver y editar datos
- Configuración y logout

---

## Fase 8: ECS Fargate y Deploy

### Paso 8.1 - Crear ECR repositories

- Repositorios para cada servicio

### Paso 8.2 - Crear ECS Cluster

- Cluster en las 3 AZ

### Paso 8.3 - Desplegar API Service

- Task definition
- Service con 3 réplicas
- ALB
- Auto-scaling

### Paso 8.4 - Desplegar Event Processor Service

- Task definition
- Service con 3 réplicas

### Paso 8.5 - Desplegar Reservation Service

- Task definition
- Service con 3 réplicas

### Paso 8.6 - Desplegar Admin Service

- Task definition
- Service con 3 réplicas
- ALB

### Paso 8.7 - Configurar CloudWatch Logs

- Log groups para cada servicio
- Métricas y alarmas

---

## Fase 9: CI/CD

### Paso 9.1 - Crear GitHub Actions workflows

- `.github/workflows/ci.yml` - Tests y lint en PR
- `.github/workflows/deploy-dev.yml` - Deploy a dev
- `.github/workflows/deploy-prod.yml` - Deploy a prod

### Paso 9.2 - Configurar secrets en GitHub

- AWS credentials
- Variables de entorno

### Paso 9.3 - Configurar branch protection

- Require PR reviews
- Require status checks

---

## Fase 10: Testing

### Paso 10.1 - Unit tests con Vitest

- Cobertura 80% mínimo
- Tests para servicios NestJS
- Tests para lambdas

### Paso 10.2 - Integration tests

- Tests de APIs con supertest
- Tests con testcontainers (Kafka, Redis, PostgreSQL)

### Paso 10.3 - E2E tests

- Cypress para web admin
- Detox para mobile app

### Paso 10.4 - Load tests

- k6 para pruebas de carga
- Simulación de 1000 usuarios concurrentes

---

## Fase 11: Monitoreo y Observabilidad

### Paso 11.1 - Configurar CloudWatch Dashboards

- Dashboard general del sistema
- Métricas de ocupación
- Estado de servicios

### Paso 11.2 - Configurar alarmas

- CPU > 80% -> Auto-scaling
- Error rate > 5% -> SNS alert
- Ocupación > 90% -> SNS alert

### Paso 11.3 - Configurar X-Ray

- Tracing distribuido
- Service map

---

## Fase 12: Seguridad

### Paso 12.1 - Configurar WAF

- Reglas SQL injection, XSS
- Rate limiting
- IP reputation

### Paso 12.2 - Configurar CloudFront

- CDN para web admin
- Integración con WAF

### Paso 12.3 - Configurar Route53

- DNS público
- Health checks
- Failover

### Paso 12.4 - Configurar Secrets Manager

- Rotación de credenciales
- Certificados IoT

### Paso 12.5 - Configurar KMS

- Encriptación en reposo

---

## Orden de Implementación Recomendado

1. **Fase 1** - Setup inicial (1-2 días)
2. **Fase 2** - IaC hasta RDS, Redis, DynamoDB, Kafka (3-5 días)
3. **Fase 3** - Servicios NestJS (5-7 días)
4. **Fase 4** - Lambda functions (3-4 días)
5. **Fase 5** - API Gateway y AppSync (2-3 días)
6. **Fase 6** - IoT Core y firmware ESP32 (5-7 días)
7. **Fase 7** - Aplicaciones frontend (5-7 días)
8. **Fase 8** - ECS Fargate deploy (2-3 días)
9. **Fase 9** - CI/CD (1-2 días)
10. **Fase 10** - Testing (3-5 días)
11. **Fase 11** - Monitoreo (1-2 días)
12. **Fase 12** - Seguridad (2-3 días)

**Total estimado: 33-50 días de desarrollo**
