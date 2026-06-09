# Sistema de Estacionamiento Público IoT con AWS

## 2.1 Contexto del Problema

Los estacionamientos públicos enfrentan desafíos significativos en la gestión
eficiente de espacios, control de acceso y experiencia del usuario. Los
problemas principales incluyen:

- **Falta de visibilidad en tiempo real**: Los conductores no pueden conocer la
  disponibilidad de plazas antes de llegar al estacionamiento, generando
  congestión y pérdida de tiempo.
- **Control de acceso manual**: Sistemas tradicionales requieren personal humano
  para validar accesos, incrementando costos operativos y generando errores.
- **Ausencia de sistema de reservas**: Los usuarios no pueden garantizar un
  espacio disponible, especialmente en horas pico.
- **Falta de auditoría y trazabilidad**: No existe registro detallado de
  ingresos, egresos y ocupación para análisis y toma de decisiones.
- **Escalabilidad limitada**: Arquitecturas monolíticas que no pueden crecer
  según la demanda del estacionamiento.

Este proyecto propone una solución IoT integrada con servicios cloud de AWS para
crear un estacionamiento inteligente, descentralizado y altamente disponible.

## 2.2 Objetivo General

Diseñar e implementar un sistema de gestión de estacionamiento público basado en
IoT y arquitectura orientada a eventos en AWS, que permita el control
automatizado de acceso, monitoreo en tiempo real de ocupación, sistema de
reservas para usuarios registrados y auditoría completa, garantizando alta
disponibilidad, escalabilidad y desacoplamiento de componentes.

## 2.3 Objetivos Específicos

1. **Implementar infraestructura IoT** con ESP32, sensores infrarrojos, lectores
   RFID y actuadores para detectar ocupación de plazas y controlar acceso de
   vehículos.

2. **Diseñar arquitectura de eventos desacoplada** utilizando Apache Kafka, SQS
   y EventBridge para garantizar procesamiento asíncrono y resiliente de eventos
   del sistema.

3. **Desarrollar API Gateway público** para autenticación de usuarios, registro
   y consultas básicas, con integración a Cognito para gestión de identidades.

4. **Implementar API Gateway privado** para comunicación interna entre
   microservicios, con endpoints para gestión de reservas, monitoreo de sensores
   y administración.

5. **Crear aplicación móvil (APK)** para usuarios registrados que permita
   consultar disponibilidad en tiempo real y realizar reservas de plazas.

6. **Desarrollar aplicación web administrativa** para que administradores
   monitoreen el estacionamiento, gestionen usuarios y consulten auditoría.

7. **Configurar alta disponibilidad** con múltiples Availability Zones (3 AZ) en
   us-east-2, con ALB distribuidos y ECS Fargate para contenedores.

8. **Implementar AppSync** para consultas GraphQL en tiempo real desde la app
   móvil y web, con suscripciones para actualizaciones automáticas.

9. **Establecer sistema de logging y auditoría** con CloudWatch, almacenando
   todos los eventos de ingreso/egreso de vehículos y acciones de usuarios.

10. **Configurar seguridad perimetral** con WAF, CloudFront y Route53 para
    proteger endpoints y optimizar latencia.

---

## Arquitectura de Servicios AWS

### Configuración de Red (VPC)

**Región**: us-east-2 (Ohio)  
**Availability Zones**: 3 AZ (us-east-2a, us-east-2b, us-east-2c)

**Justificación de 3 AZ**:

- Balance entre alta disponibilidad y costo
- Tolerancia a fallos de hasta 2 AZ simultáneas
- Cumple con requisitos de alta disponibilidad para sistemas críticos

### Componentes de Red

```
VPC (10.0.0.0/16)
├── Public Subnets (3)
│   ├── us-east-2a: 10.0.1.0/24
│   ├── us-east-2b: 10.0.2.0/24
│   └── us-east-2c: 10.0.3.0/24
├── Private Subnets (3)
│   ├── us-east-2a: 10.0.10.0/24
│   ├── us-east-2b: 10.0.11.0/24
│   └── us-east-2c: 10.0.12.0/24
├── Data Subnets (3)
│   ├── us-east-2a: 10.0.20.0/24
│   ├── us-east-2b: 10.0.21.0/24
│   └── us-east-2c: 10.0.22.0/24
├── Internet Gateway
├── NAT Gateways (3, uno por AZ para alta disponibilidad)
└── VPC Endpoints para servicios AWS
```

---

## Flujo de Servicios AWS

### 1. Capa de Entrada y Distribución

**Route53**

- DNS público para el dominio del estacionamiento
- Routing policies: Latency-based para optimizar tiempos de respuesta
- Health checks para monitoreo de endpoints

**CloudFront**

- CDN global para distribución de contenido estático (app web admin)
- Caché de respuestas de API para reducir latencia
- Integración con WAF para filtrado de tráfico malicioso

**WAF (Web Application Firewall)**

- Reglas de protección contra SQL injection, XSS
- Rate limiting para prevenir abusos
- IP reputation lists
- Integrado con CloudFront y API Gateway

**Application Load Balancer (ALB)**

- **2 ALB distribuidos en diferentes AZ** para alta disponibilidad
- Distribución de tráfico a ECS Fargate clusters
- Health checks a nivel de aplicación
- SSL termination

### 2. API Gateways

**API Gateway Público**

- **Propósito**: Exposición de endpoints para clientes externos (app móvil y
  web)
- **Autenticación**: Integración con Amazon Cognito
- **Endpoints**:
  ```
  POST /auth/signup          - Registro de nuevos usuarios
  POST /auth/signin          - Login de usuarios
  POST /auth/refresh         - Refresh token
  POST /auth/logout          - Logout
  GET  /parking/availability - Consultar disponibilidad en tiempo real
  POST /parking/reserve      - Reservar plaza (requiere autenticación)
  DELETE /parking/reserve/{id} - Cancelar reserva
  GET  /user/reservations    - Listar reservas del usuario
  GET  /user/profile         - Perfil del usuario
  PUT  /user/profile         - Actualizar perfil
  ```
- **Throttling**: Rate limiting por usuario y global
- **Caching**: Respuestas de disponibilidad con TTL de 30 segundos

**API Gateway Privado**

- **Propósito**: Comunicación interna entre microservicios dentro de la VPC
- **Acceso**: Solo desde VPC mediante VPC Endpoint
- **Endpoints**:
  ```
  POST /internal/sensor/occupancy    - Registrar cambio de ocupación
  POST /internal/vehicle/entry       - Registrar ingreso de vehículo
  POST /internal/vehicle/exit        - Registrar egreso de vehículo
  GET  /internal/parking/status      - Estado completo del estacionamiento
  POST /internal/reservation/validate - Validar reserva antes de ingreso
  POST /internal/rfid/validate       - Validar tag RFID
  POST /internal/audit/log           - Registrar evento de auditoría
  GET  /internal/admin/metrics       - Métricas para dashboard admin
  POST /admin/users                  - Crear usuario (admin)
  PUT  /admin/users/{id}             - Actualizar usuario (admin)
  DELETE /admin/users/{id}           - Desactivar usuario (admin)
  GET  /admin/audit                  - Consultar logs de auditoría (admin)
  ```

### 3. Aplicaciones y Microservicios

**ECS Fargate Cluster**

- **Distribución**: Servicios desplegados en las 3 AZ
- **Task Definitions**: Múltiples servicios contenerizados
- **Servicios**:

  **a. API Service (NestJS)**
  - Contenedores: 3 réplicas mínimo (distribuidas en 3 AZ)
  - Auto-scaling basado en CPU/memoria
  - Expone endpoints REST para API Gateway
  - Comunicación con Kafka para publicación de eventos
  - Conexión a RDS PostgreSQL para operaciones CRUD

  **b. Event Processor Service (NestJS)**
  - Consumidor de eventos de Kafka
  - Procesa eventos de ocupación, ingreso, egreso
  - Actualiza estado del estacionamiento en Redis
  - Publica eventos procesados a EventBridge

  **c. Reservation Service (NestJS)**
  - Gestión de reservas de plazas
  - Validación de disponibilidad
  - Prevención de sobre-reservas
  - Integración con Redis para locks distribuidos

  **d. Admin Service (NestJS)**
  - APIs para aplicación web administrativa
  - Gestión de usuarios
  - Consulta de auditoría
  - Generación de reportes

**AWS Lambda Functions**

- **Monorepo con Node.js 24**
- **Funciones**:

  ```
  /lambdas
  ├── sensor-data-processor/     - Procesa datos de sensores IoT
  ├── rfid-validator/            - Valida tags RFID contra base de datos
  ├── notification-sender/       - Envía notificaciones push a app móvil
  ├── occupancy-aggregator/      - Agrega datos de ocupación por zona
  ├── audit-logger/              - Registra eventos en CloudWatch Logs
  ├── reservation-cleanup/       - Limpia reservas expiradas (cada 5 min)
  ├── daily-report-generator/    - Genera reportes diarios (programado)
  └── health-checker/            - Verifica salud de servicios (cada 1 min)
  ```

- **Trigger**: EventBridge rules para ejecución programada
- **Timeout**: 15 minutos máximo
- **Memoria**: 512 MB - 2 GB según función

### 4. Capa de Eventos y Mensajería

**Apache Kafka (MSK - Managed Streaming for Kafka)**

- **Cluster**: 3 brokers distribuidos en 3 AZ
- **Topics**:
  ```
  - vehicle.entry          - Eventos de ingreso de vehículos
  - vehicle.exit           - Eventos de egreso de vehículos
  - sensor.occupancy       - Cambios de estado de sensores
  - reservation.created    - Nuevas reservas
  - reservation.cancelled  - Cancelaciones de reservas
  - rfid.validation        - Validaciones de RFID
  - audit.events           - Eventos de auditoría
  ```
- **Retención**: 7 días por defecto
- **Replicación**: Factor de replicación 3 (uno por AZ)

**Amazon EventBridge**

- **Event Bus**: Bus principal para eventos del sistema
- **Rules**:
  ```
  - vehicle.entry -> Lambda audit-logger
  - vehicle.exit -> Lambda audit-logger
  - reservation.created -> Lambda notification-sender
  - sensor.occupancy.critical -> SNS alert
  ```
- **Targets**: Lambda, SNS, SQS, CloudWatch Logs

**Amazon SQS**

- **Colas**:
  ```
  - dlq-sensor-processing    - Dead letter queue para fallos de procesamiento
  - dlq-notification-sender  - DLQ para notificaciones fallidas
  - reservation-queue        - Cola para procesamiento asíncrono de reservas
  ```
- **Dead Letter Queues**: Para reintentos y análisis de fallos

### 5. Capa de Datos

**Amazon RDS PostgreSQL**

- **Configuración**: Multi-AZ deployment (primario en us-east-2a, standby en
  us-east-2b)
- **Instance**: db.r5.large (escalable según demanda)
- **Read Replicas**: 2 réplicas de lectura en us-east-2b y us-east-2c
- **Backups**: Automáticos cada 24h, retención de 30 días
- **Tablas principales**:
  ```sql
  - users              - Usuarios registrados
  - vehicles           - Vehículos asociados a usuarios
  - reservations       - Reservas de plazas
  - parking_spots      - Estado de plazas
  - audit_logs         - Logs de auditoría
  - rfid_tags          - Tags RFID autorizados
  - sensor_data        - Datos históricos de sensores
  ```

**Amazon ElastiCache Redis**

- **Configuración**: Cluster mode enabled, 3 shards (uno por AZ)
- **Propósito**:
  - Estado en tiempo real de ocupación
  - Caché de consultas frecuentes
  - Locks distribuidos para reservas
  - Sesiones de usuario
- **TTL**: 5 minutos para datos de ocupación

**Amazon DynamoDB**

- **Tablas**:
  ```
  - RFIDValidations    - Historial de validaciones RFID
  - SensorReadings     - Lecturas de sensores (time-series)
  - WebSocketConnections - Conexiones activas de AppSync
  ```
- **On-demand capacity**: Para cargas variables

### 6. Capa de Tiempo Real

**AWS AppSync**

- **GraphQL API**: Para consultas y suscripciones en tiempo real
- **Data Sources**:
  - RDS PostgreSQL (usuarios, reservas)
  - ElastiCache Redis (ocupación en tiempo real)
  - DynamoDB (datos de sensores)
- **Queries**:

  ```graphql
  type Query {
    getParkingAvailability: ParkingStatus
    getUserReservations(userId: ID!): [Reservation]
    getParkingSpotStatus(spotId: ID!): ParkingSpot
  }

  type Subscription {
    onOccupancyChanged: ParkingStatus
      @aws_subscribe(mutations: ["updateOccupancy"])
    onReservationCreated(userId: ID!): Reservation
      @aws_subscribe(mutations: ["createReservation"])
  }
  ```

- **Autenticación**: Cognito User Pools
- **Real-time**: WebSockets para suscripciones

### 7. IoT Core y Dispositivos

**AWS IoT Core**

- **Endpoint**: MQTT broker para comunicación con ESP32
- **Topics**:
  ```
  - parking/sensors/occupancy/{sensorId}
  - parking/rfid/entry/{deviceId}
  - parking/rfid/exit/{deviceId}
  - parking/commands/servo/{servoId}
  - parking/commands/display/{displayId}
  ```
- **Rules**:
  ```
  - sensor/occupancy -> Kafka topic sensor.occupancy
  - rfid/entry -> Lambda rfid-validator
  - rfid/exit -> Lambda rfid-validator
  ```
- **Device Shadows**: Estado deseado y reportado de dispositivos
- **Certificates**: X.509 para autenticación de dispositivos

**ESP32 Firmware**

- **Conexión**: MQTT over TLS a IoT Core
- **Publicaciones**:
  - Datos de sensores infrarrojos (ocupación de plazas)
  - Lecturas de RFID (validación de acceso)
  - Estado de sensores ultrasónicos
- **Suscripciones**:
  - Comandos para servomotores (apertura de tranqueras)
  - Comandos para LCD (mensajes de bienvenida/denegación)
- **QoS**: 1 para mensajes críticos (RFID), 0 para telemetría

### 8. Monitoreo y Observabilidad

**Amazon CloudWatch**

- **Logs**:
  - Todos los servicios ECS Fargate
  - Lambda functions
  - API Gateway
  - IoT Core
- **Metrics**:
  - CPU/Memoria de contenedores
  - Latencia de APIs
  - Errores por servicio
  - Ocupación del estacionamiento
- **Alarms**:
  - CPU > 80% por 5 minutos -> Auto-scaling
  - Error rate > 5% -> SNS alert
  - Ocupación > 90% -> SNS alert
- **Dashboards**:
  - Vista general del sistema
  - Métricas de ocupación en tiempo real
  - Estado de servicios

**AWS X-Ray**

- **Tracing distribuido**: Seguimiento de requests a través de todos los
  servicios
- **Service Map**: Visualización de dependencias
- **Latencia**: Identificación de cuellos de botella

### 9. Seguridad

**Amazon Cognito**

- **User Pool**: Para usuarios de app móvil
- **Identity Pool**: Para acceso a recursos AWS desde app móvil
- **MFA**: Opcional para usuarios administradores
- **OAuth 2.0**: Flows para autenticación

**AWS Secrets Manager**

- **Secrets**:
  - Credenciales de base de datos
  - API keys de servicios externos
  - Certificados de dispositivos IoT
- **Rotation**: Automática cada 30 días para credenciales de RDS

**AWS KMS**

- **Encryption**: Datos en reposo (RDS, S3, DynamoDB)
- **Key Management**: Customer managed keys para datos sensibles

### 10. Almacenamiento de Logs y Auditoría

**Amazon S3**

- **Buckets**:
  ```
  - parking-audit-logs-{env}    - Logs de auditoría archivados
  - parking-backups-{env}       - Backups de base de datos
  - parking-assets-{env}        - Assets estáticos (imágenes, etc)
  ```
- **Lifecycle policies**: Mover a Glacier después de 90 días
- **Versioning**: Habilitado para backups

**Amazon Athena**

- **Queries**: Análisis de logs de auditoría almacenados en S3
- **Integration**: Con QuickSight para visualización

---

## Flujos Completos del Sistema

### Flujo 1: Ingreso de Vehículo Registrado con Reserva Activa

**Paso 1.1 - Detección de proximidad del vehículo a la entrada**

El sensor ultrasónico HC-SR04 montado en la entrada del estacionamiento emite un
pulso ultrasónico cada 200ms. Cuando un vehículo se encuentra a menos de 50cm
del sensor, el eco rebota y el sensor calcula la distancia. El ESP32, que está
leyendo continuamente el pin GPIO conectado al HC-SR04, detecta que la distancia
bajó de 50cm a menos de 10cm. El firmware del ESP32 interpreta esto como
"vehículo acercándose a la entrada" y enciende el LED rojo de diagnóstico para
indicar actividad en la puerta de entrada. El ESP32 construye un payload JSON
con la siguiente estructura:
`{"deviceId": "entry-gate-01", "event": "proximity_detected", "distance_cm": 8, "timestamp": 1717000000000}`
y lo publica vía MQTT over TLS al topic `parking/rfid/entry/proximity` con QoS 0
(telemetría, no crítico). AWS IoT Core recibe el mensaje, evalúa la rule
configurada que matchea el topic `parking/rfid/entry/proximity` y como acción
tiene "write to Kafka" al topic `sensor.proximity`. El mensaje llega al broker
MSK Kafka en el partition 0 del topic `sensor.proximity`. El Event Processor
Service (NestJS en ECS Fargate) que está consumiendo este topic recibe el
mensaje pero solo lo loguea en CloudWatch como métrica de "vehículos en cola de
entrada" para el dashboard del admin. No requiere acción adicional en este
punto.

**Paso 1.2 - Lectura del tag RFID del usuario registrado**

El conductor del vehículo se identifica como usuario registrado y acerca su tag
RFID (tarjeta o llavero) al lector RFID-RC522 montado en el exterior de la
entrada. El lector RC522 opera a frecuencia 13.56 MHz y lee el UID único de 4
bytes del tag. El ESP32, que está haciendo polling continuo al lector via SPI,
detecta el nuevo tag y obtiene el UID (ejemplo: `A3:BF:22:01`). El ESP32
construye el payload JSON:
`{"deviceId": "entry-gate-01", "event": "rfid_scan", "rfid_uid": "A3:BF:22:01", "reader_location": "exterior", "timestamp": 1717000005000}`
y lo publica vía MQTT over TLS al topic `parking/rfid/entry/entry-gate-01` con
QoS 1 (mensaje crítico, requiere confirmación de entrega). AWS IoT Core recibe
el mensaje y evalúa las rules configuradas. La primera rule matchea el patrón
`parking/rfid/entry/+` y tiene como acción invocar la Lambda `rfid-validator` de
forma asíncrona (Event invocation). La Lambda se ejecuta con un payload que
incluye el `rfid_uid`, el `deviceId` y el `timestamp`.

**Paso 1.3 - Validación del tag RFID contra la base de datos**

La Lambda `rfid-validator` (Node.js 24, 512MB RAM, timeout 30s) se ejecuta en un
contenedor efímero. Primero, inicializa el AWS SDK y establece conexión con
DynamoDB usando el endpoint de la VPC. Ejecuta un `GetItem` contra la tabla
`RFIDValidations` con la clave `rfid_uid: "A3:BF:22:01"`. DynamoDB retorna el
item si existe:
`{"rfid_uid": "A3:BF:22:01", "user_id": "usr-12345", "is_active": true, "vehicle_plate": "ABC-1234", "created_at": "2025-01-15T10:00:00Z"}`.
Si el item no existe o `is_active` es `false`, la Lambda construye un payload de
denegación:
`{"valid": false, "reason": "rfid_not_found_or_inactive", "rfid_uid": "A3:BF:22:01", "timestamp": 1717000006000}`
y lo publica al topic MQTT `parking/commands/display/entry-lcd` con el mensaje
`{"action": "display", "message": "Acceso Denegado", "color": "red"}` y termina
su ejecución. Si el item existe y está activo, la Lambda continúa al paso 1.4.

**Paso 1.4 - Verificación de reserva activa del usuario**

La Lambda `rfid-validator`, habiendo confirmado que el RFID es válido y
pertenece al `user_id: "usr-12345"`, ahora necesita verificar si este usuario
tiene una reserva activa. Hace una llamada HTTP interna (via VPC Endpoint) al
API Gateway privado en el endpoint `POST /internal/reservation/validate` con el
body `{"user_id": "usr-12345", "rfid_uid": "A3:BF:22:01"}`. El API Gateway
privado rutea la petición al Admin Service (NestJS en ECS Fargate) que está
detrás del ALB en la private subnet. El Admin Service recibe la petición, extrae
el `user_id` y ejecuta una consulta SQL contra RDS PostgreSQL:
`SELECT * FROM reservations WHERE user_id = 'usr-12345' AND status = 'active' AND reservation_date = CURRENT_DATE AND checked_in_at IS NULL ORDER BY created_at DESC LIMIT 1`.
RDS retorna la reserva si existe:
`{"reservation_id": "res-789", "user_id": "usr-12345", "parking_spot_id": "spot-05", "status": "active", "created_at": "2025-06-08T08:00:00Z", "expires_at": "2025-06-08T23:59:59Z"}`.
El Admin Service retorna a la Lambda:
`{"has_reservation": true, "reservation": {...}}` o
`{"has_reservation": false}`. En este flujo asumimos que SÍ tiene reserva activa
en `spot-05`.

**Paso 1.5 - Publicación del evento de validación exitosa a Kafka**

La Lambda `rfid-validator` construye el payload completo de validación exitosa:
`{"event_type": "rfid_validated", "rfid_uid": "A3:BF:22:01", "user_id": "usr-12345", "vehicle_plate": "ABC-1234", "has_reservation": true, "reservation_id": "res-789", "assigned_spot": "spot-05", "gate": "entry", "timestamp": 1717000007000}`.
Publica este payload al topic Kafka `rfid.validation` usando el producer de
Kafka configurado con `acks: all` para garantizar que el mensaje fue persistido
en al menos un broker. El producer usa la clave `user_id: "usr-12345"` para
garantizar que todos los eventos de este usuario vayan a la misma partición,
manteniendo el orden.

**Paso 1.6 - Apertura de la tranquera de entrada**

Simultáneamente al paso 1.5, la Lambda `rfid-validator` publica un mensaje MQTT
al topic `parking/commands/servo/entry-servo` con QoS 1:
`{"action": "open", "servo_id": "entry-servo-01", "angle": 90, "duration_ms": 5000, "timestamp": 1717000007000}`.
También publica al topic `parking/commands/display/entry-lcd` con QoS 1:
`{"action": "display", "message": "Bienvenido", "sub_message": "Plaza 05", "color": "green", "timestamp": 1717000007000}`.
El ESP32, que está suscrito a ambos topics, recibe el comando del servo. El
firmware mueve el servomotor SG90 del pin GPIO correspondiente de 0° a 90°
usando PWM. La tranquera física se abre. El ESP32 confirma la ejecución
publicando un ack al topic `parking/commands/servo/entry-servo/ack`. El LCD 16x2
con interfaz I2C recibe el comando de display y muestra en la línea 1
"Bienvenido" y en la línea 2 "Plaza 05" con backlight verde (controlado por un
pin GPIO del ESP32).

**Paso 1.7 - Detección del paso del vehículo por la entrada**

El vehículo avanza y cruza la línea donde está montado el sensor infrarrojo de
obstáculos ubicado justo después de la tranquera. El sensor infrarrojo, que
normalmente tiene su pin de salida en HIGH (no detecta obstáculo), cambia a LOW
al detectar el vehículo pasando. El ESP32 detecta el flanco descendente en el
GPIO y construye el payload:
`{"deviceId": "entry-gate-01", "event": "vehicle_passed_entry", "sensor_id": "ir-entry-01", "timestamp": 1717000012000}`
y lo publica al topic MQTT `parking/vehicle/entry` con QoS 1.

**Paso 1.8 - IoT Core envía evento de ingreso a Kafka**

AWS IoT Core recibe el mensaje del topic `parking/vehicle/entry` y la rule
configurada matchea este patrón. La rule tiene como acción "write to Kafka" al
topic `vehicle.entry`. El mensaje llega al broker MSK Kafka en el topic
`vehicle.entry`.

**Paso 1.9 - Event Processor Service procesa el ingreso**

El Event Processor Service (NestJS en ECS Fargate) que está consumiendo el topic
Kafka `vehicle.entry` recibe el mensaje. El servicio ejecuta la siguiente
secuencia de operaciones en una transacción:

1. **Actualiza el estado de la plaza asignada en Redis**: Ejecuta
   `HSET parking:spot:05 status "occupied" user_id "usr-12345" vehicle_plate "ABC-1234" occupied_since "1717000012000"`
   con un TTL de 24 horas. Si el usuario tenía reserva, también ejecuta
   `HSET parking:spot:05 reservation_id "res-789"`.

2. **Actualiza el contador global de ocupación en Redis**: Ejecuta
   `INCR parking:stats:total_occupied` y `DECR parking:stats:total_available`.
   El resultado de `parking:stats:total_available` se usa para saber cuántas
   plazas libres quedan en tiempo real.

3. **Actualiza la reserva en RDS PostgreSQL**: Ejecuta
   `UPDATE reservations SET checked_in_at = NOW(), status = 'checked_in' WHERE reservation_id = 'res-789'`.

4. **Registra el ingreso en la tabla audit_logs de RDS**: Ejecuta
   `INSERT INTO audit_logs (event_type, user_id, vehicle_plate, parking_spot_id, gate, timestamp, metadata) VALUES ('vehicle_entry', 'usr-12345', 'ABC-1234', 'spot-05', 'entry', NOW(), '{"rfid_uid": "A3:BF:22:01", "reservation_id": "res-789"}')`.

5. **Publica evento procesado a EventBridge**: Construye el evento
   `{"source": "parking.event-processor", "detail-type": "VehicleEntryProcessed", "detail": {"user_id": "usr-12345", "vehicle_plate": "ABC-1234", "parking_spot_id": "spot-05", "reservation_id": "res-789", "timestamp": "2025-06-08T10:00:12Z"}}`
   y lo publica en el EventBridge default bus.

**Paso 1.10 - EventBridge dispara auditoría y notificaciones**

EventBridge recibe el evento `VehicleEntryProcessed` y evalúa las rules
configuradas. La primera rule tiene como patrón
`{"detail-type": ["VehicleEntryProcessed"]}` y como targets:

- **Target 1 - Lambda `audit-logger`**: Se invoca de forma asíncrona. La Lambda
  recibe el detalle del evento, construye un log estructurado en formato JSON y
  lo escribe en CloudWatch Logs en el log group `/parking/audit/vehicle-entry`.
  Adicionalmente, hace un `PutObject` a S3 en el bucket
  `parking-audit-logs-prod` con la key
  `audit/2025/06/08/vehicle-entry-{timestamp}.json` para archivado permanente.

- **Target 2 - Lambda `notification-sender`**: Se invoca de forma asíncrona. La
  Lambda consulta DynamoDB para obtener el `device_token` del usuario
  `usr-12345` (token de Firebase/APNs registrado en la app móvil). Construye la
  notificación push:
  `{"title": "Ingreso confirmado", "body": "Tu vehículo fue registrado en la plaza 05", "data": {"reservation_id": "res-789", "spot_id": "spot-05"}}`
  y la envía vía Firebase Cloud Messaging (FCM) al dispositivo móvil del
  usuario. Si el envío falla, el mensaje se envía a la SQS Dead Letter Queue
  `dlq-notification-sender` para reintentos posteriores.

**Paso 1.11 - AppSync propaga cambio en tiempo real a la app móvil**

El Event Processor Service, después de actualizar Redis en el paso 1.9, también
invoca una mutation en AppSync vía HTTP (data source configurado). La mutation
es
`updateOccupancy(input: {totalAvailable: 4, totalOccupied: 6, totalReserved: 2, updatedAt: "2025-06-08T10:00:12Z"})`.
AppSync procesa la mutation y automáticamente notifica a todos los clientes que
tienen una suscripción activa a `onOccupancyChanged`. La app móvil del usuario
(y de cualquier otro usuario suscrito) recibe la actualización en tiempo real
vía WebSocket y actualiza su UI mostrando la nueva disponibilidad.

**Paso 1.12 - Cierre automático de la tranquera**

El ESP32 tiene un timer configurado en firmware de 5000ms (5 segundos). Después
de que expira el timer desde la apertura, el firmware mueve el servomotor SG90
de 90° de vuelta a 0°. La tranquera se cierra físicamente. El ESP32 publica un
mensaje al topic `parking/commands/servo/entry-servo/status` con
`{"status": "closed", "timestamp": 1717000017000}`. El LCD cambia su mensaje a
"Estacionamiento Disponible - Pase su tarjeta" que es el mensaje por defecto en
estado idle.

---

### Flujo 2: Ingreso de Vehículo Registrado sin Reserva

**Paso 2.1 - Detección de proximidad del vehículo**

Idéntico al paso 1.1. El sensor ultrasónico HC-SR04 detecta el vehículo a menos
de 10cm. El ESP32 publica el payload de proximidad al topic MQTT
`parking/rfid/entry/proximity`. IoT Core lo rutea a Kafka topic
`sensor.proximity`. El Event Processor Service lo registra como métrica.

**Paso 2.2 - Lectura del tag RFID**

Idéntico al paso 1.2. El usuario acerca su tag RFID al lector RC522 exterior. El
ESP32 lee el UID y publica al topic MQTT `parking/rfid/entry/entry-gate-01` con
QoS 1. IoT Core invoca la Lambda `rfid-validator`.

**Paso 2.3 - Validación del tag RFID**

Idéntico al paso 1.3. La Lambda `rfid-validator` consulta DynamoDB y confirma
que el tag `A3:BF:22:01` pertenece al usuario `usr-12345` y está activo.

**Paso 2.4 - Verificación de reserva: NO tiene reserva activa**

La Lambda `rfid-validator` hace la llamada al API Gateway privado
`POST /internal/reservation/validate` con `{"user_id": "usr-12345"}`. El Admin
Service ejecuta la consulta SQL contra RDS:
`SELECT * FROM reservations WHERE user_id = 'usr-12345' AND status = 'active' AND reservation_date = CURRENT_DATE AND checked_in_at IS NULL`.
La consulta retorna 0 filas. El Admin Service responde a la Lambda:
`{"has_reservation": false, "message": "No active reservation found"}`.

**Paso 2.5 - Verificación de disponibilidad de plazas libres**

La Lambda `rfid-validator`, al recibir `has_reservation: false`, necesita
verificar si hay plazas libres disponibles para permitir el ingreso de este
vehículo. Hace una llamada HTTP al API Gateway privado
`GET /internal/parking/status`. El Admin Service consulta Redis:
`GET parking:stats:total_available`. Redis retorna el valor, por ejemplo `3`
(quedan 3 plazas libres). Si el valor es `0`, la Lambda publica al topic MQTT
`parking/commands/display/entry-lcd`:
`{"action": "display", "message": "Estacionamiento", "sub_message": "LLENO", "color": "red"}`
y termina sin abrir la tranquera. Si hay plazas disponibles (valor > 0),
continúa al paso 2.6.

**Paso 2.6 - Asignación de plaza libre**

El Admin Service, en la misma respuesta al endpoint `/internal/parking/status`,
incluye la lista de plazas libres consultando Redis:
`SCAN 0 MATCH parking:spot:* status free COUNT 100`. Retorna
`{"available_spots": ["spot-02", "spot-07", "spot-10"], "total_available": 3}`.
La Lambda `rfid-validator` toma la primera plaza libre de la lista: `spot-02`.
Construye el payload:
`{"event_type": "rfid_validated_no_reservation", "rfid_uid": "A3:BF:22:01", "user_id": "usr-12345", "vehicle_plate": "ABC-1234", "has_reservation": false, "assigned_spot": "spot-02", "gate": "entry", "timestamp": 1717000007000}`
y lo publica al topic Kafka `rfid.validation`.

**Paso 2.7 - Apertura de tranquera y mensaje en LCD**

La Lambda publica al topic MQTT `parking/commands/servo/entry-servo`:
`{"action": "open", "servo_id": "entry-servo-01", "angle": 90, "duration_ms": 5000}`.
Y al topic `parking/commands/display/entry-lcd`:
`{"action": "display", "message": "Bienvenido", "sub_message": "Plaza 02", "color": "green"}`.
El ESP32 abre la tranquera (servo a 90°) y el LCD muestra "Bienvenido" / "Plaza
02".

**Paso 2.8 - Detección del paso del vehículo**

Idéntico al paso 1.7. El sensor infrarrojo detecta el paso del vehículo. El
ESP32 publica al topic MQTT `parking/vehicle/entry`. IoT Core lo envía a Kafka
topic `vehicle.entry`.

**Paso 2.9 - Event Processor Service procesa el ingreso sin reserva**

El Event Processor Service consume el evento de Kafka `vehicle.entry`. Ejecuta:

1. **Actualiza la plaza asignada en Redis**:
   `HSET parking:spot:02 status "occupied" user_id "usr-12345" vehicle_plate "ABC-1234" occupied_since "1717000012000" has_reservation "false"`.

2. **Actualiza contadores globales**: `INCR parking:stats:total_occupied` y
   `DECR parking:stats:total_available`. Ahora `total_available` es `2`.

3. **Registra ingreso en RDS audit_logs**:
   `INSERT INTO audit_logs (event_type, user_id, vehicle_plate, parking_spot_id, gate, timestamp, metadata) VALUES ('vehicle_entry_no_reservation', 'usr-12345', 'ABC-1234', 'spot-02', 'entry', NOW(), '{"rfid_uid": "A3:BF:22:01"}')`.

4. **Publica evento a EventBridge**:
   `{"source": "parking.event-processor", "detail-type": "VehicleEntryProcessed", "detail": {"user_id": "usr-12345", "vehicle_plate": "ABC-1234", "parking_spot_id": "spot-02", "has_reservation": false, "timestamp": "2025-06-08T10:00:12Z"}}`.

**Paso 2.10 - Auditoría y notificaciones**

Idéntico al paso 1.10. EventBridge dispara Lambda `audit-logger` (log en
CloudWatch + archivo en S3) y Lambda `notification-sender` (push notification a
la app móvil del usuario: "Ingreso confirmado - Plaza 02").

**Paso 2.11 - Propagación en tiempo real vía AppSync**

Idéntico al paso 1.11. El Event Processor Service invoca la mutation
`updateOccupancy` en AppSync. Todos los clientes suscritos a
`onOccupancyChanged` reciben la actualización.

**Paso 2.12 - Cierre de tranquera**

Idéntico al paso 1.12. Timer de 5 segundos, servo vuelve a 0°, LCD vuelve a
mensaje idle.

---

### Flujo 3: Ingreso de Vehículo NO Registrado (Visitante)

**Paso 3.1 - Detección de proximidad del vehículo**

El sensor ultrasónico HC-SR04 detecta un vehículo acercándose a la entrada,
exactamente igual que en los flujos anteriores. El ESP32 publica al topic MQTT
`parking/rfid/entry/proximity`. IoT Core lo envía a Kafka. El Event Processor
Service registra la métrica de proximidad.

**Paso 3.2 - Lectura del tag RFID o ausencia del mismo**

Aquí se presentan dos sub-escenarios:

**Escenario A: El visitante tiene un tag RFID de visitante (tarjeta temporal)**

El estacionamiento cuenta con tarjetas RFID temporales que el admin entrega a
visitantes ocasionales. Estas tarjetas tienen un UID registrado en el sistema
pero asociadas a un tipo `visitor` en lugar de `registered_user`. El visitante
acerca la tarjeta temporal al lector RC522 exterior. El ESP32 lee el UID
(ejemplo: `FF:AA:BB:CC`) y publica al topic MQTT
`parking/rfid/entry/entry-gate-01` con QoS 1. IoT Core invoca la Lambda
`rfid-validator`.

**Escenario B: El visitante NO tiene ningún tag RFID**

El vehículo se detiene frente a la entrada pero el conductor no tiene ningún tag
RFID. Después de 15 segundos de detectar proximidad sin lectura RFID, el ESP32
ejecuta una lógica de timeout en firmware: publica al topic MQTT
`parking/commands/display/entry-lcd`:
`{"action": "display", "message": "Pase su", "sub_message": "tarjeta RFID", "color": "yellow"}`.
Si después de 30 segundos adicionales no hay lectura, el ESP32 publica al topic
MQTT `parking/rfid/entry/timeout` con
`{"deviceId": "entry-gate-01", "event": "rfid_timeout", "timeout_seconds": 30}`.
Este evento se envía a Kafka topic `sensor.timeout` y el Event Processor Service
lo registra como métrica de "timeout de lectura RFID" para el dashboard del
admin. El LCD entra en un loop mostrando "Pase su tarjeta" / "O espere" cada 5
segundos hasta que se detecte un tag o el vehículo se retire (el sensor
ultrasónico deja de detectar proximidad).

**Paso 3.3 - Validación del tag RFID de visitante (Escenario A)**

La Lambda `rfid-validator` consulta DynamoDB tabla `RFIDValidations` con
`rfid_uid: "FF:AA:BB:CC"`. DynamoDB retorna:
`{"rfid_uid": "FF:AA:BB:CC", "user_type": "visitor", "user_id": "visitor-temp-001", "is_active": true, "valid_until": "2025-06-08T23:59:59Z", "vehicle_plate": "XYZ-9876"}`.
La Lambda verifica que `is_active` es `true` y que `valid_until` es mayor al
timestamp actual. La validación es exitosa pero el `user_type` es `visitor`, lo
que significa que NO tiene reserva (los visitantes no pueden reservar).

**Paso 3.4 - Verificación de disponibilidad para visitante**

La Lambda `rfid-validator`, al detectar `user_type: "visitor"`, sabe que no
necesita buscar reserva. Directamente verifica disponibilidad haciendo la
llamada al API Gateway privado `GET /internal/parking/status`. El Admin Service
consulta Redis: `GET parking:stats:total_available`. Si el valor es `0`
(estacionamiento lleno), la Lambda publica al topic MQTT
`parking/commands/display/entry-lcd`:
`{"action": "display", "message": "Estacionamiento", "sub_message": "LLENO", "color": "red"}`.
La tranquera NO se abre. El LCD muestra "LLENO" durante 10 segundos y luego
vuelve al estado idle. La Lambda publica un evento de denegación por lleno en
Kafka topic `vehicle.entry_denied` con
`{"reason": "parking_full", "rfid_uid": "FF:AA:BB:CC", "user_type": "visitor"}`.
Este evento llega a EventBridge que dispara Lambda `audit-logger` para registrar
la denegación.

Si hay plazas disponibles (ej: `total_available: 3`), continúa al paso 3.5.

**Paso 3.5 - Asignación de plaza para visitante**

El Admin Service retorna la lista de plazas libres. La Lambda `rfid-validator`
aplica una lógica de asignación diferente para visitantes: asigna siempre la
plaza libre más lejana a la entrada (los visitantes se ubican al fondo, dejando
las plazas cercanas para usuarios registrados con reserva). Consulta Redis
`HGETALL parking:spots` y filtra las plazas con `status: "free"` y
`zone: "far"`. Selecciona `spot-08`. Construye el payload:
`{"event_type": "visitor_entry", "rfid_uid": "FF:AA:BB:CC", "user_type": "visitor", "user_id": "visitor-temp-001", "vehicle_plate": "XYZ-9876", "has_reservation": false, "assigned_spot": "spot-08", "gate": "entry", "timestamp": 1717000007000}`
y lo publica a Kafka topic `rfid.validation`.

**Paso 3.6 - Apertura de tranquera y mensaje diferenciado en LCD**

La Lambda publica al topic MQTT `parking/commands/servo/entry-servo`:
`{"action": "open", "servo_id": "entry-servo-01", "angle": 90, "duration_ms": 5000}`.
Y al topic `parking/commands/display/entry-lcd`:
`{"action": "display", "message": "Bienvenido", "sub_message": "Plaza 08", "color": "yellow"}`.
Nota: el color es amarillo (no verde) para diferenciar visualmente que es un
visitante, no un usuario registrado. El ESP32 abre la tranquera y el LCD muestra
"Bienvenido" / "Plaza 08" con backlight amarillo.

**Paso 3.7 - Detección del paso del vehículo**

El sensor infrarrojo detecta el paso del vehículo. El ESP32 publica al topic
MQTT `parking/vehicle/entry`. IoT Core lo envía a Kafka topic `vehicle.entry`.

**Paso 3.8 - Event Processor Service procesa el ingreso de visitante**

El Event Processor Service consume el evento de Kafka. Ejecuta:

1. **Actualiza la plaza en Redis**:
   `HSET parking:spot:08 status "occupied" user_id "visitor-temp-001" user_type "visitor" vehicle_plate "XYZ-9876" occupied_since "1717000012000" has_reservation "false"`.

2. **Actualiza contadores globales**: `INCR parking:stats:total_occupied` y
   `DECR parking:stats:total_available`. Ahora `total_available` es `2`.

3. **Actualiza contador de visitantes**: `INCR parking:stats:total_visitors`.

4. **Registra en RDS audit_logs**:
   `INSERT INTO audit_logs (event_type, user_id, user_type, vehicle_plate, parking_spot_id, gate, timestamp, metadata) VALUES ('visitor_entry', 'visitor-temp-001', 'visitor', 'XYZ-9876', 'spot-08', 'entry', NOW(), '{"rfid_uid": "FF:AA:BB:CC"}')`.

5. **Publica evento a EventBridge**:
   `{"source": "parking.event-processor", "detail-type": "VisitorEntryProcessed", "detail": {"user_id": "visitor-temp-001", "vehicle_plate": "XYZ-9876", "parking_spot_id": "spot-08", "timestamp": "2025-06-08T10:00:12Z"}}`.

**Paso 3.9 - Auditoría del ingreso de visitante**

EventBridge recibe el evento `VisitorEntryProcessed`. La rule matchea y dispara
Lambda `audit-logger`. La Lambda escribe en CloudWatch Logs el log de auditoría
y archiva en S3. Nota: NO se ejecuta Lambda `notification-sender` porque el
visitante no tiene app móvil ni cuenta registrada.

**Paso 3.10 - Propagación en tiempo real vía AppSync**

El Event Processor Service invoca la mutation `updateOccupancy` en AppSync. La
app móvil de los usuarios registrados suscritos recibe la actualización de
disponibilidad. La web app del admin también recibe la actualización y muestra
en el dashboard que un visitante ingresó a la plaza 08.

**Paso 3.11 - Cierre de tranquera**

Timer de 5 segundos en el ESP32. Servo vuelve a 0°. LCD vuelve a mensaje idle:
"Estacionamiento Disponible - Pase su tarjeta".

---

### Flujo 4: Egreso de Vehículo (Registrado o No Registrado)

**Paso 4.1 - Vehículo se acerca a la salida**

El sensor ultrasónico HC-SR04 montado en la salida detecta un vehículo a menos
de 10cm. El ESP32 de la salida (un ESP32 independiente dedicado a la salida)
publica al topic MQTT `parking/rfid/exit/proximity` con
`{"deviceId": "exit-gate-01", "event": "proximity_detected", "distance_cm": 7, "timestamp": 1717000100000}`.
IoT Core lo envía a Kafka topic `sensor.proximity`.

**Paso 4.2 - Lectura RFID en la salida**

El conductor acerca su tag RFID al lector RC522 montado en el interior de la
salida (el lector interior valida que el vehículo que sale es el mismo que
entró). El ESP32 de la salida lee el UID y publica al topic MQTT
`parking/rfid/exit/exit-gate-01` con QoS 1:
`{"deviceId": "exit-gate-01", "event": "rfid_scan", "rfid_uid": "A3:BF:22:01", "reader_location": "interior", "timestamp": 1717000105000}`.

**Paso 4.3 - IoT Core invoca Lambda de validación de salida**

AWS IoT Core recibe el mensaje y la rule matchea el patrón
`parking/rfid/exit/+`. La rule invoca la Lambda `rfid-validator` con el payload
del evento de salida. La Lambda detecta que es un evento de salida (por el
topic) y ejecuta una lógica diferente a la de entrada.

**Paso 4.4 - Lambda valida que el vehículo tiene una sesión activa**

La Lambda `rfid-validator` consulta DynamoDB para validar el RFID (igual que en
entrada). Luego hace una llamada al API Gateway privado
`POST /internal/vehicle/validate-exit` con `{"rfid_uid": "A3:BF:22:01"}`. El
Admin Service consulta Redis para verificar que este RFID tiene una sesión
activa dentro del estacionamiento: `HGETALL parking:spot:*` buscando `user_id`
asociado. Encuentra:
`parking:spot:05 -> {"status": "occupied", "user_id": "usr-12345", "rfid_uid": "A3:BF:22:01", "occupied_since": "1717000012000"}`.
Retorna a la Lambda:
`{"valid_exit": true, "parking_spot_id": "spot-05", "user_id": "usr-12345", "occupied_since": 1717000012000, "duration_minutes": 45}`.

**Paso 4.5 - Apertura de tranquera de salida**

La Lambda publica al topic MQTT `parking/commands/servo/exit-servo`:
`{"action": "open", "servo_id": "exit-servo-01", "angle": 90, "duration_ms": 5000}`.
Y al topic `parking/commands/display/exit-lcd`:
`{"action": "display", "message": "Hasta pronto", "sub_message": "45 min", "color": "green"}`.
El ESP32 de la salida abre la tranquera y el LCD muestra "Hasta pronto" / "45
min" (duración de la estadía).

**Paso 4.6 - Detección del paso del vehículo por la salida**

El sensor infrarrojo de la salida detecta el paso del vehículo. El ESP32 publica
al topic MQTT `parking/vehicle/exit`:
`{"deviceId": "exit-gate-01", "event": "vehicle_passed_exit", "sensor_id": "ir-exit-01", "timestamp": 1717000112000}`.
IoT Core lo envía a Kafka topic `vehicle.exit`.

**Paso 4.7 - Event Processor Service procesa el egreso**

El Event Processor Service consume el evento de Kafka `vehicle.exit`. Ejecuta:

1. **Libera la plaza en Redis**:
   `HSET parking:spot:05 status "free" occupied_since "" user_id "" vehicle_plate "" reservation_id ""`.
   Elimina los campos con `HDEL`.

2. **Actualiza contadores globales**: `DECR parking:stats:total_occupied` y
   `INCR parking:stats:total_available`. Ahora `total_available` vuelve a `3`.

3. **Si el usuario tenía reserva, la marca como completada**:
   `UPDATE reservations SET checked_out_at = NOW(), status = 'completed' WHERE user_id = 'usr-12345' AND status = 'checked_in'`.

4. **Registra egreso en RDS audit_logs**:
   `INSERT INTO audit_logs (event_type, user_id, vehicle_plate, parking_spot_id, gate, timestamp, metadata) VALUES ('vehicle_exit', 'usr-12345', 'ABC-1234', 'spot-05', 'exit', NOW(), '{"duration_minutes": 45, "rfid_uid": "A3:BF:22:01"}')`.

5. **Publica evento a EventBridge**:
   `{"source": "parking.event-processor", "detail-type": "VehicleExitProcessed", "detail": {"user_id": "usr-12345", "vehicle_plate": "ABC-1234", "parking_spot_id": "spot-05", "duration_minutes": 45, "timestamp": "2025-06-08T10:45:12Z"}}`.

**Paso 4.8 - Auditoría y notificaciones del egreso**

EventBridge dispara Lambda `audit-logger` (log en CloudWatch + archivo en S3) y
Lambda `notification-sender` (push notification: "Salida confirmada - Duración:
45 min").

**Paso 4.9 - Propagación en tiempo real**

El Event Processor Service invoca la mutation `updateOccupancy` en AppSync.
Todos los clientes suscritos reciben la actualización de disponibilidad.

**Paso 4.10 - Cierre de tranquera de salida**

Timer de 5 segundos. Servo de salida vuelve a 0°. LCD de salida vuelve a mensaje
idle.

---

### Flujo 5: Reserva de Plaza desde App Móvil

**Paso 5.1 - Usuario abre la app móvil y establece conexión en tiempo real**

El usuario registrado abre la aplicación móvil (APK) en su dispositivo Android.
La app inicializa el cliente Apollo Client configurado con el endpoint de AWS
AppSync. Establece una conexión WebSocket persistente con AppSync usando el JWT
token obtenido de Amazon Cognito (ID token). La conexión WebSocket se mantiene
abierta con ping/pong cada 30 segundos para evitar timeout. La app ejecuta la
suscripción GraphQL:
`subscription { onOccupancyChanged { totalAvailable totalOccupied totalReserved spots { spotId status zone } updatedAt } }`.
AppSync registra esta suscripción en la tabla `WebSocketConnections` de DynamoDB
con el `connectionId` del WebSocket.

**Paso 5.2 - Consulta inicial de disponibilidad**

Inmediatamente después de establecer la suscripción, la app ejecuta la query
GraphQL:
`query { getParkingAvailability { totalAvailable totalOccupied totalReserved totalSpots spots { spotId status zone userType } } }`.
AppSync recibe la query. El resolver de AppSync configurado para
`getParkingAvailability` tiene como data source ElastiCache Redis. AppSync
ejecuta `GET parking:stats:total_available`, `GET parking:stats:total_occupied`,
`GET parking:stats:total_reserved`, `GET parking:stats:total_spots` y
`HGETALL parking:spots` para obtener el estado de cada plaza. Redis retorna
todos los valores. AppSync construye la respuesta GraphQL y la envía a la app
móvil vía WebSocket. La app renderiza en su UI un mapa visual del
estacionamiento mostrando: plazas verdes (libres), plazas rojas (ocupadas),
plazas amarillas (reservadas). Por ejemplo: "4 plazas disponibles de 10".

**Paso 5.3 - Usuario selecciona una plaza específica**

El usuario toca en la UI de la app la plaza que desea reservar (ej: `spot-03`,
que aparece como verde/libre). La app muestra un modal de confirmación: "¿Desea
reservar la Plaza 03? Zona: cercana a entrada". El usuario confirma tocando
"Reservar".

**Paso 5.4 - App ejecuta mutation de reserva**

La app ejecuta la mutation GraphQL en AppSync:
`mutation { createReservation(input: { parkingSpotId: "spot-03", reservationDate: "2025-06-08" }) { reservationId status parkingSpotId expiresAt message } }`.
AppSync recibe la mutation. El resolver de `createReservation` tiene como data
source el API Gateway privado. AppSync invoca internamente
`POST /internal/reservation/create` en el API Gateway privado con el body:
`{"user_id": "usr-12345", "parking_spot_id": "spot-03", "reservation_date": "2025-06-08"}`.
El `user_id` se extrae del claims del JWT de Cognito que AppSync incluye en el
header de la invocación.

**Paso 5.5 - Reservation Service valida y crea la reserva**

El API Gateway privado rutea la petición al Reservation Service (NestJS en ECS
Fargate). El servicio ejecuta la siguiente secuencia atómica:

1. **Adquiere lock distribuido en Redis**: Ejecuta
   `SET parking:lock:spot-03 NX EX 10` (lock con expiración de 10 segundos para
   evitar deadlocks). Si el lock no se puede adquirir (otro usuario está
   reservando la misma plaza simultáneamente), retorna error:
   `{"error": "PLAZA_EN_PROCESO", "message": "Otro usuario está reservando esta plaza, intente nuevamente"}`.

2. **Verifica disponibilidad de la plaza**: Ejecuta
   `HGET parking:spot:03 status`. Redis retorna `"free"`. Si retorna
   `"occupied"` o `"reserved"`, libera el lock (`DEL parking:lock:spot-03`) y
   retorna error:
   `{"error": "PLAZA_NO_DISPONIBLE", "message": "La plaza 03 ya no está disponible"}`.

3. **Verifica que el usuario no tenga otra reserva activa**: Ejecuta en RDS:
   `SELECT COUNT(*) FROM reservations WHERE user_id = 'usr-12345' AND status = 'active' AND reservation_date = '2025-06-08'`.
   Si el count es > 0, libera el lock y retorna error:
   `{"error": "RESERVA_EXISTENTE", "message": "Ya tiene una reserva activa para hoy"}`.

4. **Crea la reserva en RDS PostgreSQL**: Ejecuta dentro de una transacción:
   `BEGIN; INSERT INTO reservations (reservation_id, user_id, parking_spot_id, status, reservation_date, created_at, expires_at) VALUES ('res-new-001', 'usr-12345', 'spot-03', 'active', '2025-06-08', NOW(), '2025-06-08T23:59:59Z'); UPDATE parking_spots SET status = 'reserved', reserved_by = 'usr-12345', reservation_id = 'res-new-001' WHERE spot_id = 'spot-03'; COMMIT;`.

5. **Actualiza Redis con el estado de la plaza**:
   `HSET parking:spot:03 status "reserved" reserved_by "usr-12345" reservation_id "res-new-001"`.

6. **Actualiza contador de reservas**: `INCR parking:stats:total_reserved` y
   `DECR parking:stats:total_available`.

7. **Libera el lock distribuido**: `DEL parking:lock:spot-03`.

8. **Registra en audit_logs**:
   `INSERT INTO audit_logs (event_type, user_id, parking_spot_id, timestamp, metadata) VALUES ('reservation_created', 'usr-12345', 'spot-03', NOW(), '{"reservation_id": "res-new-001"}')`.

9. **Publica evento a Kafka topic `reservation.created`**:
   `{"event_type": "reservation_created", "reservation_id": "res-new-001", "user_id": "usr-12345", "parking_spot_id": "spot-03", "reservation_date": "2025-06-08", "expires_at": "2025-06-08T23:59:59Z", "timestamp": 1717000200000}`.

10. **Publica evento a EventBridge**:
    `{"source": "parking.reservation-service", "detail-type": "ReservationCreated", "detail": {"reservation_id": "res-new-001", "user_id": "usr-12345", "parking_spot_id": "spot-03"}}`.

El Reservation Service retorna la respuesta exitosa:
`{"reservationId": "res-new-001", "status": "active", "parkingSpotId": "spot-03", "expiresAt": "2025-06-08T23:59:59Z", "message": "Reserva confirmada"}`.

**Paso 5.6 - AppSync propaga la reserva en tiempo real**

La respuesta del Reservation Service llega a AppSync, que la retorna como
resultado de la mutation. Simultáneamente, el resolver de AppSync invoca la
mutation interna `updateOccupancy` para actualizar el estado global. AppSync
notifica a todos los clientes suscritos a `onOccupancyChanged` con los nuevos
valores. Adicionalmente, el cliente que creó la reserva recibe la notificación
vía suscripción `onReservationCreated(userId: "usr-12345")`. La app móvil
actualiza su UI: la plaza 03 ahora aparece como amarilla (reservada) con el
nombre del usuario.

**Paso 5.7 - Notificación push de confirmación**

EventBridge recibe el evento `ReservationCreated` y dispara Lambda
`notification-sender`. La Lambda consulta DynamoDB para obtener el
`device_token` del usuario `usr-12345`. Envía push notification vía FCM:
`{"title": "Reserva confirmada", "body": "Tu plaza 03 ha sido reservada exitosamente", "data": {"reservation_id": "res-new-001", "spot_id": "spot-03"}}`.
La app móvil recibe la notificación push y muestra un toast de confirmación.

---

### Flujo 6: Cancelación de Reserva desde App Móvil

**Paso 6.1 - Usuario navega a sus reservas activas**

El usuario abre la app móvil y navega a la sección "Mis Reservas". La app
ejecuta la query GraphQL:
`query { getUserReservations(userId: "usr-12345") { reservationId parkingSpotId status reservationDate createdAt expiresAt } }`.
AppSync resuelve contra RDS PostgreSQL:
`SELECT * FROM reservations WHERE user_id = 'usr-12345' AND status IN ('active', 'checked_in') ORDER BY created_at DESC`.
Retorna la lista de reservas. La app muestra: "Plaza 03 - Activa - Expira:
23:59".

**Paso 6.2 - Usuario solicita cancelación**

El usuario toca "Cancelar Reserva" en la plaza 03. La app muestra un modal:
"¿Está seguro de cancelar su reserva de la Plaza 03?". El usuario confirma.

**Paso 6.3 - App ejecuta mutation de cancelación**

La app ejecuta:
`mutation { cancelReservation(input: { reservationId: "res-new-001" }) { success message } }`.
AppSync invoca `DELETE /internal/reservation/res-new-001` en el API Gateway
privado.

**Paso 6.4 - Reservation Service procesa la cancelación**

El Reservation Service ejecuta:

1. **Adquiere lock**: `SET parking:lock:res-new-001 NX EX 10`.

2. **Verifica que la reserva existe y está activa**:
   `SELECT * FROM reservations WHERE reservation_id = 'res-new-001' AND status = 'active'`.
   Si no existe o ya fue usada, retorna error.

3. **Cancela la reserva en RDS**:
   `BEGIN; UPDATE reservations SET status = 'cancelled', cancelled_at = NOW() WHERE reservation_id = 'res-new-001'; UPDATE parking_spots SET status = 'free', reserved_by = NULL, reservation_id = NULL WHERE spot_id = 'spot-03'; COMMIT;`.

4. **Actualiza Redis**: `HSET parking:spot:03 status "free"` y elimina campos
   `reserved_by` y `reservation_id`. `DECR parking:stats:total_reserved` y
   `INCR parking:stats:total_available`.

5. **Libera lock**: `DEL parking:lock:res-new-001`.

6. **Registra auditoría**:
   `INSERT INTO audit_logs (event_type, user_id, parking_spot_id, timestamp, metadata) VALUES ('reservation_cancelled', 'usr-12345', 'spot-03', NOW(), '{"reservation_id": "res-new-001"}')`.

7. **Publica a Kafka topic `reservation.cancelled`** y a **EventBridge**.

**Paso 6.5 - Propagación en tiempo real y notificación**

AppSync actualiza la disponibilidad. EventBridge dispara Lambda `audit-logger` y
Lambda `notification-sender` (push: "Reserva de Plaza 03 cancelada"). La plaza
03 vuelve a aparecer como verde (libre) en la app de todos los usuarios.

---

### Flujo 7: Registro de Usuario por Administrador

**Paso 7.1 - Admin accede a la plataforma web**

El administrador abre la aplicación web en su navegador. La URL apunta a
CloudFront (distribución CDN) que sirve los assets estáticos de la web app
(React/Next.js). El admin ingresa sus credenciales. La web app las envía a
`POST /auth/signin` en el API Gateway público. API Gateway valida contra Amazon
Cognito User Pool. Cognito retorna los tokens (ID token, access token, refresh
token). La web app almacena los tokens en memoria y los usa para todas las
peticiones subsequentes.

**Paso 7.2 - Admin navega a la sección de gestión de usuarios**

La web app hace `GET /admin/users` al API Gateway privado (a través de la VPC).
El Admin Service consulta RDS:
`SELECT user_id, name, email, vehicle_plate, is_active, created_at FROM users ORDER BY created_at DESC`.
Retorna la lista de usuarios. La web app muestra una tabla con todos los
usuarios registrados.

**Paso 7.3 - Admin crea un nuevo usuario**

El admin toca "Nuevo Usuario" y completa el formulario: Nombre: "Juan Pérez",
Email: "juan@email.com", Placa: "DEF-5678", Tag RFID: "B4:CC:33:02" (lee el tag
con un lector USB conectado a su PC o lo ingresa manualmente). La web app envía
`POST /admin/users` al API Gateway privado con el body:
`{"name": "Juan Pérez", "email": "juan@email.com", "vehicle_plate": "DEF-5678", "rfid_uid": "B4:CC:33:02"}`.

**Paso 7.4 - Admin Service crea el usuario y sus credenciales**

El Admin Service ejecuta:

1. **Crea el usuario en Cognito**: Usa el AWS SDK para invocar `AdminCreateUser`
   en el Cognito User Pool con `username: "juan@email.com"`,
   `attributes: [{name: "email", value: "juan@email.com"}, {name: "name", value: "Juan Pérez"}, {name: "custom:vehicle_plate", value: "DEF-5678"}]`.
   Cognito genera una contraseña temporal y la envía por email al usuario.

2. **Crea el registro en RDS**:
   `INSERT INTO users (user_id, name, email, vehicle_plate, is_active, created_at) VALUES ('usr-new-001', 'Juan Pérez', 'juan@email.com', 'DEF-5678', true, NOW())`.

3. **Registra el tag RFID en DynamoDB**: `PutItem` en tabla `RFIDValidations`:
   `{"rfid_uid": "B4:CC:33:02", "user_id": "usr-new-001", "is_active": true, "vehicle_plate": "DEF-5678", "created_at": "2025-06-08T10:00:00Z"}`.

4. **Registra auditoría**:
   `INSERT INTO audit_logs (event_type, admin_id, user_id, timestamp, metadata) VALUES ('user_created', 'admin-001', 'usr-new-001', NOW(), '{"email": "juan@email.com", "rfid_uid": "B4:CC:33:02"}')`.

5. **Publica evento a EventBridge**:
   `{"source": "parking.admin-service", "detail-type": "UserCreated", "detail": {"user_id": "usr-new-001", "email": "juan@email.com"}}`.

**Paso 7.5 - Notificación al nuevo usuario**

EventBridge dispara Lambda `notification-sender`. La Lambda envía un email al
nuevo usuario vía Amazon SES (Simple Email Service):
`{"subject": "Bienvenido al Estacionamiento", "body": "Su cuenta ha sido creada. Descargue la app móvil e inicie sesión con su email y la contraseña temporal enviada."}`.
Adicionalmente, si el usuario ya tiene la app instalada y se registró
previamente, envía push notification.

---

### Flujo 8: Monitoreo Administrativo en Tiempo Real

**Paso 8.1 - Admin abre el dashboard principal**

La web app del admin establece conexión WebSocket con AppSync (usando el JWT del
admin). Se suscribe a:
`subscription { onOccupancyChanged { totalAvailable totalOccupied totalReserved totalSpots spots { spotId status zone userType vehiclePlate occupiedSince } updatedAt } }`.
También ejecuta la query inicial `getParkingAvailability` para obtener el estado
actual.

**Paso 8.2 - Dashboard muestra estado en tiempo real**

La web app renderiza:

- **Panel superior**: Total plazas: 10 | Libres: 4 | Ocupadas: 4 | Reservadas: 2
- **Mapa visual**: Representación gráfica del estacionamiento con colores por
  estado
- **Panel lateral**: Lista de los últimos eventos (ingresos/egresos) en tiempo
  real vía suscripción AppSync
- **Gráficos**: Ocupación por hora, plazas más usadas, tiempo promedio de
  estadía

**Paso 8.3 - Admin consulta auditoría**

El admin navega a "Auditoría" y filtra por fecha: "Hoy". La web app ejecuta
`GET /admin/audit?date=2025-06-08&page=1&limit=50` en el API Gateway privado. El
Admin Service consulta RDS:
`SELECT * FROM audit_logs WHERE timestamp >= '2025-06-08T00:00:00Z' AND timestamp < '2025-06-09T00:00:00Z' ORDER BY timestamp DESC LIMIT 50 OFFSET 0`.
Retorna los registros. La web app muestra una tabla con: Timestamp | Evento |
Usuario | Placa | Plaza | Detalles.

**Paso 8.4 - Admin consulta auditoría histórica (S3 + Athena)**

Para períodos más antiguos (> 30 días), el Admin Service consulta Athena:
`SELECT * FROM parking_audit_logs WHERE year = '2025' AND month = '03' AND event_type = 'vehicle_entry'`.
Athena ejecuta la query sobre los archivos JSON almacenados en S3 bucket
`parking-audit-logs-prod`. Los resultados se retornan al admin.

**Paso 8.5 - Admin desactiva un usuario**

El admin selecciona un usuario de la lista y toca "Desactivar". La web app
ejecuta `DELETE /admin/users/usr-12345` (soft delete). El Admin Service:
`UPDATE users SET is_active = false, deactivated_at = NOW() WHERE user_id = 'usr-12345'`.
También desactiva el tag RFID en DynamoDB: `UpdateItem SET is_active = false`. Y
desactiva el usuario en Cognito: `AdminDisableUser`. El usuario ya no podrá
ingresar al estacionamiento ni acceder a la app móvil.

---

### Flujo 9: Detección de Ocupación de Plaza por Sensor Infrarrojo

**Paso 9.1 - Sensor infrarrojo detecta vehículo en plaza**

Cada una de las 10 plazas del estacionamiento tiene un sensor infrarrojo de
obstáculos montado en el suelo, apuntando hacia arriba. Cuando un vehículo se
estaciona sobre la plaza, el sensor infrarrojo detecta el obstáculo (el chasis
del vehículo) y su pin de salida cambia de HIGH a LOW. El ESP32, que está
leyendo los 10 sensores infrarrojos en los pines GPIO correspondientes, detecta
el cambio de estado en el sensor de la plaza 05 (pin GPIO 25, por ejemplo).

**Paso 9.2 - ESP32 publica cambio de ocupación**

El firmware del ESP32 construye el payload:
`{"sensor_id": "ir-spot-05", "event": "occupancy_change", "previous_state": "free", "current_state": "occupied", "timestamp": 1717000050000}`
y lo publica al topic MQTT `parking/sensors/occupancy/ir-spot-05` con QoS 0
(telemetría).

**Paso 9.3 - IoT Core envía a Kafka**

AWS IoT Core recibe el mensaje. La rule matchea el patrón
`parking/sensors/occupancy/+` y tiene como acción "write to Kafka" al topic
`sensor.occupancy`. El mensaje llega a MSK Kafka.

**Paso 9.4 - Event Processor Service detecta cambio de estado**

El Event Processor Service consume el mensaje del topic Kafka
`sensor.occupancy`. Compara el `current_state` con el estado actual en Redis:
`HGET parking:spot:05 status`. Si el estado en Redis es `"free"` y el sensor
dice `"occupied"`, significa que un vehículo se estacionó en esa plaza SIN haber
pasado por el proceso de entrada RFID (posible intrusión o error). El servicio
genera una alerta:

1. **Actualiza Redis**:
   `HSET parking:spot:05 status "occupied" detected_by "sensor" occupied_since "1717000050000"`.

2. **Publica alerta en EventBridge**:
   `{"source": "parking.event-processor", "detail-type": "OccupancyAnomalyDetected", "detail": {"parking_spot_id": "spot-05", "anomaly": "occupancy_without_entry", "sensor_id": "ir-spot-05", "timestamp": "2025-06-08T10:00:50Z"}}`.

**Paso 9.5 - Alerta al administrador**

EventBridge matchea la rule para `OccupancyAnomalyDetected` y tiene dos targets:

- **Target 1 - Lambda `audit-logger`**: Registra la anomalía en CloudWatch y S3.
- **Target 2 - SNS Topic `admin-alerts`**: Publica una alerta que envía un
  email/SMS al admin: "ALERTA: Plaza 05 detectada como ocupada sin registro de
  ingreso. Posible intrusión."

**Paso 9.6 - Sensor infrarrojo detecta liberación de plaza**

Cuando el vehículo se retira de la plaza 05, el sensor infrarrojo vuelve a
detectar estado libre (pin vuelve a HIGH). El ESP32 publica:
`{"sensor_id": "ir-spot-05", "event": "occupancy_change", "previous_state": "occupied", "current_state": "free", "timestamp": 1717000300000}`
al topic MQTT `parking/sensors/occupancy/ir-spot-05`. IoT Core lo envía a Kafka.
El Event Processor Service actualiza Redis: `HSET parking:spot:05 status "free"`
y actualiza los contadores globales.

---

### Flujo 10: Limpieza Automática de Reservas Expiradas

**Paso 10.1 - EventBridge dispara Lambda programada**

EventBridge tiene una rule programada con cron `rate(5 minutes)` que invoca la
Lambda `reservation-cleanup`.

**Paso 10.2 - Lambda busca reservas expiradas**

La Lambda ejecuta:
`SELECT reservation_id, user_id, parking_spot_id FROM reservations WHERE status = 'active' AND expires_at < NOW()`.
Si encuentra reservas expiradas (ej: el usuario no vino y la reserva expiró),
para cada una ejecuta:

1. **Cancela en RDS**:
   `UPDATE reservations SET status = 'expired', expired_at = NOW() WHERE reservation_id = 'res-expired-001'`.
2. **Libera plaza en Redis**: `HSET parking:spot:03 status "free"` +
   `DECR parking:stats:total_reserved` + `INCR parking:stats:total_available`.
3. **Registra auditoría**:
   `INSERT INTO audit_logs (event_type, user_id, parking_spot_id, timestamp) VALUES ('reservation_expired', 'usr-12345', 'spot-03', NOW())`.
4. **Notifica al usuario**: Publica a EventBridge -> Lambda
   `notification-sender` -> push: "Tu reserva de la Plaza 03 ha expirado".

---

## Diagrama de Flujo de Datos

```
[ESP32 + Sensores IoT]
        │
        │ MQTT over TLS
        ▼
[AWS IoT Core]
        │
        ├── Rules ──► [MSK Kafka]  ──► [ECS Fargate: Event Processor]
        │                                    │
        │                                    ├──► [ElastiCache Redis] (estado tiempo real)
        │                                    ├──► [RDS PostgreSQL] (audit_logs, reservations)
        │                                    └──► [EventBridge]
        │                                              │
        │                                              ├──► [Lambda: audit-logger] ──► [CloudWatch Logs] + [S3]
        │                                              └──► [Lambda: notification-sender] ──► [FCM Push]
        │
        ├── Rules ──► [Lambda: rfid-validator]
                            │
                            ├──► [DynamoDB: RFIDValidations]
                            ├──► [API Gateway Privado] ──► [Admin Service / Reservation Service]
                            └──► [MQTT Commands] ──► [ESP32: Servos + LCD]

[App Móvil APK] ──► [Cognito Auth] ──► [API Gateway Público] ──► [ECS Fargate: API Service]
      │                                                              │
      ├── WebSocket ──► [AppSync GraphQL] ◄── [Redis + RDS + DynamoDB]
      │                                                              │
      └── Suscripciones en tiempo real                               └──► [MSK Kafka]

[Web App Admin] ──► [Cognito Auth] ──► [API Gateway Privado] ──► [Admin Service]
      │                                                              │
      └── WebSocket ──► [AppSync GraphQL]                            └──► [RDS + Redis + S3/Athena]
```

---

## Alta Disponibilidad y Resiliencia

### Estrategia Multi-AZ

**3 Availability Zones (us-east-2a, us-east-2b, us-east-2c)**

**Componentes distribuidos**:

- ECS Fargate: 3 réplicas mínimo, distribuidas en 3 AZ
- ALB: 2 load balancers en diferentes AZ
- Kafka: 3 brokers, uno por AZ
- Redis: 3 shards, uno por AZ
- RDS: Primario en us-east-2a, standby en us-east-2b, read replicas en
  us-east-2b y us-east-2c

**Tolerancia a fallos**:

- Si una AZ cae, el sistema continúa operando con las 2 restantes
- Auto-scaling groups redistribuyen tareas automáticamente
- DNS failover con Route53 health checks

### Estrategia de Recuperación

**RTO (Recovery Time Objective)**: < 5 minutos **RPO (Recovery Point
Objective)**: < 1 minuto

**Mecanismos**:

- Backups automáticos de RDS cada 24h
- Snapshots manuales antes de cambios críticos
- Replicación síncrona de RDS Multi-AZ
- Kafka replication factor 3
- Redis cluster mode con failover automático

---

## Testing Strategy

**Unit Tests (Vitest)**

- Cobertura mínima: 80%
- Tests para servicios NestJS
- Tests para Lambda functions

**Integration Tests**

- Tests de APIs con supertest
- Tests de integración con Kafka (testcontainers)
- Tests de integración con Redis

**End-to-End Tests**

- Flujos completos con Cypress (web app)
- Flujos móviles con Detox (app móvil)

**Load Tests**

- k6 para pruebas de carga
- Simulación de 1000 usuarios concurrentes

---

## Costos Estimados (Mensual)

**Nota**: Estimación para uso moderado (10,000 requests/día)

| Servicio                              | Costo Estimado |
| ------------------------------------- | -------------- |
| ECS Fargate (3 servicios, 3 réplicas) | $150           |
| RDS PostgreSQL Multi-AZ               | $200           |
| ElastiCache Redis (3 shards)          | $180           |
| MSK Kafka (3 brokers)                 | $300           |
| API Gateway (público + privado)       | $50            |
| Lambda (1M requests)                  | $20            |
| S3 (100 GB)                           | $5             |
| CloudFront (100 GB)                   | $10            |
| Route53                               | $1             |
| CloudWatch                            | $30            |
| Cognito (10,000 users)                | $5             |
| AppSync (1M requests)                 | $10            |
| IoT Core (1M messages)                | $5             |
| WAF                                   | $10            |
| **Total Estimado**                    | **~$976/mes**  |

---

## Tecnologías y Herramientas

**Backend**:

- Node.js 24
- NestJS
- TypeScript
- Monorepo (Turborepo/Nx)

**Testing**:

- Vitest
- Supertest
- Testcontainers

**IoT**:

- ESP32 con Arduino Framework
- MQTT
- C++ para firmware

**Frontend Web (Admin)**:

- React/Next.js
- Apollo Client (GraphQL)

**App Móvil**:

- React Native / Flutter
- Apollo Client

**DevOps**:

- Docker
- GitHub Actions (CI/CD)
- Terraform (Infrastructure as Code)
- AWS CDK

---

## Conclusión

Esta arquitectura proporciona un sistema de estacionamiento inteligente,
altamente disponible y escalable, utilizando los mejores servicios de AWS para
cada componente. El diseño desacoplado basado en eventos garantiza resiliencia y
capacidad de evolución del sistema.
