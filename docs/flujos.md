# Flujos del Sistema — Polaris Parking IoT

> Especificación detallada de todos los flujos operativos.  
> Complementa [`arquitectura.md`](./arquitectura.md) · Inventario hardware fijo
> del prototipo.

---

## Flujo General de Funcionamiento

Polaris es un estacionamiento público inteligente de diez plazas donde el mundo físico y el mundo digital operan como un solo sistema. En el perímetro del estacionamiento hay dos puntos de control vehicular una entrada y una salida, cada uno con su propia barrera actuada por un servomotor y su propio lector RFID. En la entrada, además, un sensor ultrasónico vigila de forma continua si hay un vehículo en la zona de paso y una pantalla LCD informa al conductor qué debe hacer o qué ocurrió con su intento de acceso. En el interior, diez plazas independientes están vigiladas cada una por un sensor infrarrojo de obstáculos y señaladas con un LED RGB que indica de un vistazo si la plaza está libre, ocupada o reservada. Cuatro microcontroladores ESP32 reparten el trabajo: uno cuida la entrada, otro la salida y dos más supervisan cinco plazas cada uno, publicando telemetría y ejecutando órdenes a través de MQTT hacia AWS IoT Core.
El ciclo de vida de una visita al estacionamiento comienza, para un usuario registrado, mucho antes de que su vehículo llegue a la puerta. Desde la aplicación móvil consulta en tiempo real cuántas plazas hay libres — información que el backend mantiene sincronizada en Redis a partir de lecturas de sensores, reservas activas e ingresos registrados — y, si lo desea, reserva una plaza concreta para una franja horaria. Esa reserva atraviesa la API pública, persiste en Aurora PostgreSQL, bloquea la plaza en Redis para evitar sobre-reservas y publica un evento en Amazon MSK Kafka para que el resto del sistema reaccione: el procesador de eventos actualiza contadores, AppSync notifica a otros clientes conectados y el nodo ESP32 correspondiente puede hacer parpadear el LED verde de esa plaza para indicar que está reservada pero aún esperando al vehículo.
Cuando el conductor se acerca a la entrada, el sensor ultrasónico detecta la proximidad del vehículo y el ESP32 de entrada lo comunica a la nube como telemetría de aproximación; la pantalla invita a acercar la tarjeta RFID. El conductor presenta su credencial física — una de las diez tarjetas del prototipo, cada una vinculada a un usuario en el sistema — y el lector RC522 lee su identificador único. Ese dato viaja por MQTT hasta una regla de IoT Core que invoca la Lambda de validación RFID. Allí se consulta DynamoDB para confirmar que la tarjeta existe y está activa, y se llama al servicio de reservas a través del API Gateway privado para verificar que el usuario tiene una reserva vigente y que aún no ha ingresado. Si todo es correcto, la Lambda ordena la apertura de la barrera de entrada y escribe un mensaje de bienvenida en el LCD; si algo falla — tarjeta desconocida, usuario dado de baja, reserva expirada o inexistente — la barrera permanece cerrada, el LCD explica el motivo y el intento queda registrado para auditoría.
La apertura de la barrera no sigue un temporizador ciego. Una vez autorizado el acceso, el servomotor de entrada gira y mantiene la tranquera levantada mientras el ultrasónico siga detectando cuerpo en la zona de paso, porque cerrar antes de tiempo representaría un riesgo directo para el vehículo. Solo cuando el sensor confirma que el arco quedó despejado — distancia por encima del umbral de seguridad de forma sostenida — el ESP32 baja la barrera y el LCD vuelve al mensaje de reposo invitando al siguiente conductor. En paralelo, el backend marca la reserva como ingresada, asocia al usuario con la plaza correspondiente, incrementa la ocupación en Redis, inserta el rastro en PostgreSQL y emite por Kafka el evento de ingreso vehicular, que alimenta auditoría, métricas y las suscripciones en tiempo real de la app y del panel administrativo.
Dentro del estacionamiento, la ocupación real de cada plaza la decide el sensor infrarrojo FC-51 asignado a esa plaza, no la barrera de entrada. Cuando un vehículo se estaciona, el obstáculo interrumpe el haz del sensor; el ESP32 de zona detecta el cambio, enciende el LED en rojo y publica un evento de cambio de ocupación. Esa señal llega a una Lambda que normaliza la lectura, la guarda en DynamoDB como histórico de telemetría y la reenvía a Kafka. El servicio procesador de eventos consume el mensaje, confirma o corrige el estado en Redis y RDS, y AppSync propaga la nueva fotografía del estacionamiento a todos los clientes suscritos. Si una plaza pasa de libre a ocupada sin un ingreso registrado en la puerta, el sistema lo trata como anomalía operativa y alerta al administrador, porque podría indicar un acceso no autorizado o un fallo de lectura en la entrada.
La salida sigue una lógica similar pero con las limitaciones del hardware disponible: en el arco de salida solo hay lector RFID y servomotor, sin ultrasónico. El conductor presenta la misma tarjeta; la Lambda valida que exista una sesión de estacionamiento abierta — es decir, un ingreso previo sin egreso correspondiente — y, si procede, abre la barrera de salida. El cierre en salida se apoya en una heurística de paso completado, porque no hay sensor de proximidad en ese punto; en una evolución futura del prototipo se podría replicar la lógica segura de la entrada instalando un segundo HC-SR04. Tras un egreso válido, la plaza queda libre en Redis, la reserva se cierra como completada, se publica el evento de salida en Kafka y el LED de la plaza volverá a verde cuando el sensor confirme que no hay vehículo encima.
Todo el sistema descansa sobre una arquitectura orientada a eventos donde Amazon MSK Kafka es la columna vertebral del dominio: ingresos, salidas, cambios de ocupación, reservas, validaciones RFID y auditoría circulan como mensajes tipados entre microservicios NestJS desplegados en ECS Fargate. EventBridge y SQS no sustituyen a Kafka; lo complementan para tareas programadas y orquestación hacia Lambdas — limpieza de reservas expiradas cada cinco minutos, reportes diarios, verificación de salud de servicios, envío de notificaciones push cuando una reserva se confirma o caduca. Las funciones Lambda, empaquetadas con Node.js 24, son el puente entre IoT Core y el resto del ecosistema: validan RFID en milisegundos, procesan ráfagas de telemetría de sensores, archivan auditoría en CloudWatch y S3, y disparan notificaciones sin mantener servidores permanentes para cargas esporádicas.
Los administradores interactúan con el sistema a través de la API privada y la aplicación web: dan de alta usuarios y tarjetas RFID, revisan logs de auditoría, observan métricas de ocupación y reciben alertas cuando una barrera permanece abierta demasiado tiempo o cuando un sensor reporta comportamiento incoherente. Cognito custodia las identidades de los usuarios finales; Secrets Manager y KMS protegen credenciales y datos en reposo; CloudWatch y X-Ray permiten reconstruir cualquier incidente cruzando logs de dispositivos, Lambdas, contenedores y colas.
En conjunto, el flujo general es circular y coherente: el usuario reserva y consulta desde la app; el hardware valida presencia física y credenciales en entrada y salida; los sensores de plaza mantienen la verdad operativa del inventario en tiempo real; Kafka difunde cada hecho relevante; Redis ofrece lecturas instantáneas; PostgreSQL conserva el historial contractual de reservas y usuarios; y las tareas en segundo plano impiden que el sistema se degrade silenciosamente cuando los usuarios no cumplen su ventana de reserva o cuando algún componente deja de responder. Los flujos numerados que siguen en este documento desglosan cada uno de esos momentos con pasos, payloads y consultas concretas; aquí, el propósito es fijar la película completa antes de entrar al fotograma a fotograma.


---

## 0. Inventario de hardware

| Componente                 | Cantidad | Función                                                 |
| -------------------------- | -------- | ------------------------------------------------------- |
| ESP32 DevKit V1            | 4        | Microcontroladores distribuidos por zona                |
| Lector RFID RC522          | 2        | Entrada y salida (SPI)                                  |
| Sensor ultrasónico HC-SR04 | 1        | Proximidad y paso completo en **entrada**               |
| LCD 16×2 I2C               | 1        | Mensajes al conductor en **entrada**                    |
| Servomotor SG90            | 2        | Barrera de entrada y barrera de salida                  |
| Tarjetas RFID              | 10       | Credenciales de usuarios registrados                    |
| Sensor IR FC-51            | 10       | Ocupación por plaza (1 sensor = 1 plaza)                |
| LED RGB                    | 10       | Indicador visual por plaza (verde libre / rojo ocupado) |
| Protoboard                 | 4        | Una por nodo ESP32                                      |

### 0.1 Distribución de nodos ESP32

| Nodo               | `deviceId`      | Periféricos                           | Plazas                |
| ------------------ | --------------- | ------------------------------------- | --------------------- |
| **ESP32 Entrada**  | `entry-gate-01` | HC-SR04, RC522, SG90 entrada, LCD I2C | —                     |
| **ESP32 Salida**   | `exit-gate-01`  | RC522, SG90 salida                    | —                     |
| **ESP32 Plazas A** | `spots-zone-a`  | FC-51 ×5, RGB ×5                      | `spot-01` … `spot-05` |
| **ESP32 Plazas B** | `spots-zone-b`  | FC-51 ×5, RGB ×5                      | `spot-06` … `spot-10` |

**Total:** 10 plazas, 10 sensores IR, 10 LEDs RGB, 10 tarjetas RFID activas en
el sistema.

---

## 1. Convenciones globales

### 1.1 Topics MQTT (AWS IoT Core)

| Topic                                     | Publicador    | Suscriptor / Acción AWS               |
| ----------------------------------------- | ------------- | ------------------------------------- |
| `parking/rfid/entry/proximity`            | ESP32 entrada | Rule → Kafka `sensor.proximity`       |
| `parking/rfid/entry/{deviceId}`           | ESP32 entrada | Rule → Lambda `rfid-validator`        |
| `parking/rfid/exit/{deviceId}`            | ESP32 salida  | Rule → Lambda `rfid-validator`        |
| `parking/sensors/occupancy/{spotId}`      | ESP32 plazas  | Rule → Lambda `sensor-data-processor` |
| `parking/commands/servo/{servoId}`        | Lambda / IoT  | ESP32 entrada/salida                  |
| `parking/commands/display/{displayId}`    | Lambda / IoT  | ESP32 entrada (LCD)                   |
| `parking/commands/servo/{servoId}/status` | ESP32         | CloudWatch metric (opcional)          |
| `parking/commands/led/{spotId}`           | Cloud (sync)  | ESP32 plazas (estado remoto)          |

### 1.2 Umbrales HC-SR04 (solo entrada)

| Umbral         | Distancia                      | Significado                                   |
| -------------- | ------------------------------ | --------------------------------------------- |
| `APPROACH`     | `< 50 cm`                      | Vehículo acercándose a la entrada             |
| `AT_GATE`      | `< 10 cm`                      | Vehículo bajo la barrera / en zona de paso    |
| `CLEARED`      | `> 50 cm` sostenido **500 ms** | Vehículo completó el paso — **seguro cerrar** |
| `SAFETY_BLOCK` | `< 15 cm`                      | **Prohibido cerrar** la barrera               |

Polling del HC-SR04: cada **200 ms**.

### 1.3 Lógica de barrera de entrada (SG90)

**Regla crítica:** la barrera **no** se cierra por temporizador fijo. El cierre
depende del HC-SR04.

```
Estado CERRADA  → servo 0°
Estado ABIERTA  → servo 90°

Abrir:   RFID válido + acceso autorizado
Mantener abierta: mientras distancia < 50 cm (vehículo en zona)
Cerrar:  solo cuando distancia > 50 cm durante 500 ms consecutivos
         Y distancia nunca estuvo < 15 cm en el instante de cierre
Timeout máximo abierta: 120 s → alerta admin, barrera sigue abierta hasta CLEARED o intervención
```

### 1.4 Lógica de barrera de salida (SG90)

No hay HC-SR04 en salida (limitación del inventario actual).

```
Abrir:   RFID válido en exit-gate-01
Mantener: mínimo 2 s tras apertura (tiempo de arranque del vehículo)
Cerrar:  6 s sin nueva lectura RFID en el lector de salida
         (heurística: el vehículo ya cruzó el arco)
Timeout máximo abierta: 60 s → cierre forzado + evento audit `exit_barrier_timeout`
```

> **Nota de diseño:** en una fase futura se recomienda agregar un segundo
> HC-SR04 en salida para aplicar la misma lógica segura que en entrada.

### 1.5 Estados de plaza

| Estado Redis `parking:spot:{id}` | LED RGB             | FC-51                                                 |
| -------------------------------- | ------------------- | ----------------------------------------------------- |
| `free`                           | Verde               | Sin obstáculo                                         |
| `occupied`                       | Rojo                | Obstáculo detectado                                   |
| `reserved`                       | Verde parpadeante\* | Sin obstáculo (reserva activa, vehículo aún no llegó) |

\* Parpadeo implementado en firmware ESP32 plazas: alternar verde ON/OFF cada
500 ms.

### 1.6 Topics Kafka (MSK)

Definidos en `@polaris/shared-types` → `KAFKA_TOPICS`.

---

## 2. Flujos de entrada

---

### Flujo 1: Ingreso de usuario registrado con reserva activa

**Actores:** conductor registrado, ESP32 entrada, Lambda `rfid-validator`, API
privada, RDS, Redis, MSK, event-processor, LCD, SG90 entrada.

**Precondiciones:**

- Usuario `usr-12345` con tarjeta RFID `A3:BF:22:01` activa.
- Reserva `res-001` en estado `active` para `spot-03`, `expires_at` futuro.
- Plaza `spot-03` en Redis: `status=reserved`, LED en zona A parpadeando verde.

#### Paso 1.1 — Detección de proximidad

El HC-SR04 en `entry-gate-01` mide cada 200 ms. La distancia baja de 50 cm a 8
cm.

El ESP32 publica (QoS 0):

```json
{
  "deviceId": "entry-gate-01",
  "event": "proximity_detected",
  "distance_cm": 8,
  "timestamp": 1717000000000
}
```

Topic: `parking/rfid/entry/proximity`

AWS IoT Rule → Kafka topic `sensor.proximity`. El `event-processor-service`
incrementa métrica `vehicles_approaching_entry` en CloudWatch. El LCD muestra:
**"Acerque su tarjeta RFID"**.

#### Paso 1.2 — Lectura RFID

El conductor acerca la tarjeta al RC522 de entrada. UID leído: `A3:BF:22:01`.

ESP32 publica (QoS 1):

```json
{
  "deviceId": "entry-gate-01",
  "event": "rfid_scan",
  "rfid_uid": "A3:BF:22:01",
  "reader_location": "entry",
  "timestamp": 1717000005000
}
```

Topic: `parking/rfid/entry/entry-gate-01`

IoT Rule → invoca Lambda `rfid-validator` (async).

#### Paso 1.3 — Validación RFID y reserva

Lambda `rfid-validator` (Node 24, VPC):

1. `GetItem` DynamoDB `RFIDValidations` → `rfid_uid: A3:BF:22:01` →
   `user_id: usr-12345`, `is_active: true`.
2. HTTP POST API Gateway privado `/internal/reservation/validate`:

   ```json
   { "userId": "usr-12345", "gate": "entry" }
   ```

3. `reservation-service` consulta RDS:

   ```sql
   SELECT reservation_id, parking_spot_id, status, expires_at
   FROM reservations
   WHERE user_id = 'usr-12345' AND status = 'active' AND expires_at > NOW()
   LIMIT 1;
   ```

   Resultado: `res-001`, `spot-03`, `active`.

4. Respuesta:
   `{ "valid": true, "userId": "usr-12345", "reservationId": "res-001", "parkingSpotId": "spot-03", "userType": "registered" }`.

5. Publica Kafka `rfid.validation` con payload completo.

#### Paso 1.4 — Autorización: LCD + apertura de barrera

Lambda publica en MQTT:

**LCD** — topic `parking/commands/display/entry-lcd`:

```json
{
  "line1": "Bienvenido Juan",
  "line2": "Plaza 03 reservada",
  "backlight": true
}
```

**Servo entrada** — topic `parking/commands/servo/entry-servo`:

```json
{ "action": "open", "angle": 90 }
```

ESP32 entrada mueve SG90 a 90°. Estado interno: `BARRIER_OPEN`. Inicia monitoreo
HC-SR04 para cierre seguro (no timer fijo).

#### Paso 1.5 — Paso del vehículo (barrera permanece abierta)

Mientras el vehículo transita bajo el arco:

- HC-SR04 reporta distancias `< 50 cm` de forma continua.
- Firmware **no cierra** la barrera aunque hayan pasado 5 s, 10 s o 30 s.
- Si distancia `< 15 cm` en el instante evaluado → flag `SAFETY_BLOCK = true`.

ESP32 publica telemetría opcional cada 1 s:

```json
{
  "deviceId": "entry-gate-01",
  "event": "passage_in_progress",
  "distance_cm": 12,
  "barrier_state": "open",
  "timestamp": 1717000010000
}
```

#### Paso 1.6 — Cierre seguro de barrera

El vehículo termina de cruzar. HC-SR04 mide `> 50 cm` de forma sostenida durante
**500 ms**.

Condiciones de cierre:

- `distance_cm > 50` durante 500 ms consecutivos.
- Última lectura `< 15 cm` fue hace al menos 500 ms (zona despejada).

ESP32 mueve SG90 a 0°. Publica:

```json
{
  "deviceId": "entry-servo",
  "status": "closed",
  "close_reason": "ultrasonic_cleared",
  "timestamp": 1717000017000
}
```

Topic: `parking/commands/servo/entry-servo/status`

LCD vuelve a idle: **"Estacionamiento Disponible - Pase su tarjeta"**.

#### Paso 1.7 — Registro de ingreso en backend

Lambda `rfid-validator` (o `event-processor` vía Kafka) ejecuta:

1. **RDS** — marcar check-in:

   ```sql
   UPDATE reservations
   SET status = 'checked_in', checked_in_at = NOW()
   WHERE reservation_id = 'res-001';
   ```

2. **Redis**:

   ```
   HSET parking:spot:03 status "occupied" userId "usr-12345" reservationId "res-001"
   DECR parking:stats:total_reserved
   INCR parking:stats:total_occupied
   ```

3. **Kafka** `vehicle.entry`:

   ```json
   {
     "eventId": "evt-001",
     "userId": "usr-12345",
     "vehiclePlate": "ABC-1234",
     "parkingSpotId": "spot-03",
     "reservationId": "res-001",
     "gate": "entry",
     "timestamp": "2025-06-19T10:00:17.000Z"
   }
   ```

4. **RDS audit_logs**:

   ```sql
   INSERT INTO audit_logs (event_type, user_id, parking_spot_id, gate, timestamp)
   VALUES ('vehicle_entry', 'usr-12345', 'spot-03', 'entry', NOW());
   ```

5. **EventBridge** → Lambda `audit-logger` → CloudWatch + S3.

6. **AppSync** subscription `onOccupancyChanged` notifica apps móvil/web.

7. **ESP32 plazas** — FC-51 en `spot-03` eventualmente confirma ocupación; LED
   pasa de parpadeo a **rojo fijo** (Flujo 8).

---

### Flujo 2: Ingreso de usuario registrado sin reserva activa

Igual al Flujo 1 hasta el **Paso 1.3**.

#### Paso 2.1 — Sin reserva válida

`/internal/reservation/validate` retorna
`{ "valid": false, "reason": "no_active_reservation" }`.

Lambda publica denegación:

**LCD:**

```json
{
  "line1": "Acceso denegado",
  "line2": "Sin reserva activa",
  "backlight": true
}
```

**Servo:** no se envía comando `open`. Barrera permanece cerrada (0°).

Kafka `rfid.validation` con `valid: false`. Audit log
`entry_denied_no_reservation`.

Tras **8 s** el LCD vuelve a mensaje idle.

---

### Flujo 3: Ingreso con tarjeta RFID inválida o desactivada

#### Paso 3.1 — RFID no encontrado

DynamoDB `GetItem` → item inexistente **o** `is_active: false`.

Lambda responde `{ "valid": false, "reason": "rfid_not_found_or_inactive" }`.

**LCD:** `"Tarjeta no registrada"` / `"Contacte administracion"`.

Barrera **no abre**. Kafka `rfid.validation`. Audit:
`entry_denied_invalid_rfid`.

---

### Flujo 4: Proximidad detectada pero sin lectura RFID (timeout)

#### Paso 4.1 — Vehículo se acerca pero no pasa tarjeta

HC-SR04 detecta proximidad (Paso 1.1). LCD: **"Acerque su tarjeta RFID"**.

Transcurren **30 s** sin evento `rfid_scan`.

#### Paso 4.2 — Reset a idle

ESP32 publica:

```json
{
  "deviceId": "entry-gate-01",
  "event": "proximity_timeout",
  "timestamp": 1717000030000
}
```

LCD vuelve a idle. Métrica CloudWatch `entry_proximity_timeouts`. No se abre
barrera.

---

### Flujo 5: RFID válido pero reserva expirada

En Paso 1.3 RDS retorna reserva con `expires_at < NOW()`.

Respuesta: `{ "valid": false, "reason": "reservation_expired" }`.

**LCD:** `"Reserva expirada"` / `"Renueve en la app"`.

Barrera no abre. Audit: `entry_denied_expired_reservation`.

> La reserva se limpiará en Flujo 10 (Lambda `reservation-cleanup`).

---

### Flujo 6: Barrera abierta — vehículo no completa el paso (timeout 120 s)

Tras autorización (Flujo 1 Paso 1.4), el vehículo no avanza: HC-SR04 sigue
`< 50 cm` por más de **120 s**.

#### Paso 6.1 — Alerta sin cierre forzado

ESP32 publica `passage_stalled`. EventBridge → SNS alerta admin.

La barrera **permanece abierta** mientras `distance < 50 cm` (regla de
seguridad). Solo cierra cuando se cumpla condición CLEARED o un operador envíe
comando remoto de cierre de emergencia vía consola admin (fuera de alcance del
prototipo).

---

## 3. Flujos de salida

---

### Flujo 7: Egreso de usuario registrado con ingreso previo

**Precondiciones:** usuario ingresó previamente (Flujo 1). Reserva en
`checked_in` o plaza `occupied` asociada al RFID.

#### Paso 7.1 — Lectura RFID en salida

RC522 en `exit-gate-01` lee `A3:BF:22:01`.

```json
{
  "deviceId": "exit-gate-01",
  "event": "rfid_scan",
  "rfid_uid": "A3:BF:22:01",
  "reader_location": "exit",
  "timestamp": 1717003600000
}
```

Topic: `parking/rfid/exit/exit-gate-01` → Lambda `rfid-validator`.

#### Paso 7.2 — Validación de egreso

1. DynamoDB confirma RFID activo → `usr-12345`.
2. API privada valida que el usuario tiene sesión de estacionamiento abierta:

   ```sql
   SELECT parking_spot_id, reservation_id FROM reservations
   WHERE user_id = 'usr-12345' AND status = 'checked_in' LIMIT 1;
   ```

   Resultado: `spot-03`, `res-001`.

3. `{ "valid": true, "action": "exit", "parkingSpotId": "spot-03" }`.

#### Paso 7.3 — Apertura barrera de salida

MQTT `parking/commands/servo/exit-servo`:

```json
{ "action": "open", "angle": 90 }
```

SG90 salida → 90°. Timer interno: mínimo **2 s** abierta.

#### Paso 7.4 — Cierre barrera de salida (sin HC-SR04)

Tras **6 s** sin nueva lectura RFID en el lector de salida:

ESP32 cierra SG90 a 0°. Publica:

```json
{
  "deviceId": "exit-servo",
  "status": "closed",
  "close_reason": "exit_passage_heuristic",
  "timestamp": 1717003608000
}
```

#### Paso 7.5 — Registro de egreso

1. **RDS**:

   ```sql
   UPDATE reservations SET status = 'completed', checked_out_at = NOW()
   WHERE reservation_id = 'res-001';

   UPDATE parking_spots SET status = 'free' WHERE spot_id = 'spot-03';
   ```

2. **Redis**:

   ```
   HSET parking:spot:03 status "free"
   HDEL parking:spot:03 userId reservationId
   DECR parking:stats:total_occupied
   INCR parking:stats:total_available
   ```

3. **Kafka** `vehicle.exit` con payload análogo al ingreso.

4. Audit log `vehicle_exit`. AppSync notifica disponibilidad.

5. Cuando FC-51 en `spot-03` confirma libre → Flujo 9.

---

### Flujo 8: Egreso con RFID inválido

Lambda retorna `{ "valid": false, "reason": "rfid_not_found_or_inactive" }`.

Barrera de salida **no abre**. Kafka + audit `exit_denied_invalid_rfid`.

---

### Flujo 9: Egreso sin ingreso registrado (RFID válido pero sin sesión abierta)

RDS no encuentra reserva `checked_in` para el usuario.

`{ "valid": false, "reason": "no_active_session" }`. Barrera no abre. Audit
`exit_denied_no_session`.

---

## 4. Flujos de ocupación de plazas (sensores FC-51)

---

### Flujo 10: Plaza pasa de libre a ocupada

**Actores:** ESP32 plazas, Lambda `sensor-data-processor`, DynamoDB, Redis, MSK,
event-processor, LED RGB.

#### Paso 10.1 — Detección IR

FC-51 en `spot-05` (ESP32 `spots-zone-a`) detecta obstáculo. Estado GPIO: LOW
(obstáculo presente).

Debouncing firmware: **300 ms** estables antes de confirmar cambio.

#### Paso 10.2 — Publicación MQTT

```json
{
  "deviceId": "spots-zone-a",
  "spotId": "spot-05",
  "event": "occupancy_changed",
  "status": "occupied",
  "sensorType": "fc-51",
  "timestamp": 1717001000000
}
```

Topic: `parking/sensors/occupancy/spot-05`

#### Paso 10.3 — Procesamiento cloud

IoT Rule → Lambda `sensor-data-processor`:

1. `PutItem` DynamoDB `SensorReadings` (time-series).
2. Publica Kafka `sensor.occupancy`.

`event-processor-service` consume:

3. **Redis** — si `spot-05` ya estaba `occupied` por ingreso vehicular,
   confirma; si estaba `free` sin ingreso → Flujo 16 (anomalía).

   ```
   HSET parking:spot:05 status "occupied"
   DECR parking:stats:total_available  (si venía de free)
   INCR parking:stats:total_occupied
   ```

4. **RDS** `parking_spots`:
   `UPDATE ... SET status = 'occupied', updated_at = NOW()`.

#### Paso 10.4 — LED RGB local

ESP32 plazas enciende LED `spot-05` en **rojo** (GPIO PWM R=HIGH, G=LOW, B=LOW).

AppSync `onOccupancyChanged` → apps actualizan mapa en tiempo real.

---

### Flujo 11: Plaza pasa de ocupada a libre

FC-51 deja de detectar obstáculo (GPIO HIGH) durante 300 ms estables.

MQTT:

```json
{
  "spotId": "spot-05",
  "event": "occupancy_changed",
  "status": "free",
  "timestamp": 1717007200000
}
```

Pipeline igual al Flujo 10. Redis:

```
HSET parking:spot:05 status "free"
INCR parking:stats:total_available
DECR parking:stats:total_occupied
```

LED → **verde**. Si existe reserva activa futura para esa plaza, el
event-processor puede volver a `reserved` (Flujo 12).

---

### Flujo 12: Plaza reservada — LED en parpadeo verde hasta ocupación

Cuando `reservation-service` confirma reserva para `spot-07`:

1. Redis: `HSET parking:spot:07 status "reserved"`.
2. Comando MQTT (opcional vía shadow) a `spots-zone-b`: modo LED `blink_green`
   en `spot-07`.
3. FC-51 sigue reportando `free` hasta que el vehículo estaciona.
4. Al detectar ocupación (Flujo 10), LED pasa a rojo fijo y Redis → `occupied`.

---

## 5. Flujos de reservas (aplicación móvil / API)

---

### Flujo 13: Usuario crea reserva desde la app

#### Paso 13.1 — Solicitud autenticada

`POST /parking/reserve` (Cognito JWT):

```json
{ "parkingSpotId": "spot-07", "reservationDate": "2025-06-19T14:00:00Z" }
```

`api-service` → `reservation-service`.

#### Paso 13.2 — Lock distribuido Redis

```
SET parking:lock:spot-07 {userId} NX EX 30
```

Si falla → `409 Conflict` "Plaza no disponible".

#### Paso 13.3 — Validación y persistencia

1. Verificar Redis `parking:spot:07` status ∈ `free`.
2. RDS:

   ```sql
   INSERT INTO reservations (reservation_id, user_id, parking_spot_id, status, expires_at, ...)
   VALUES ('res-007', 'usr-12345', 'spot-07', 'active', NOW() + INTERVAL '2 hours', ...);
   ```

3. Redis:

   ```
   HSET parking:spot:07 status "reserved" userId "usr-12345" reservationId "res-007"
   DECR parking:stats:total_available
   INCR parking:stats:total_reserved
   ```

4. Kafka `reservation.created`.

5. EventBridge → Lambda `notification-sender` → push: **"Reserva confirmada —
   Plaza 07"**.

6. Liberar lock Redis. AppSync notifica.

7. Flujo 12 — LED parpadeo verde en `spot-07`.

---

### Flujo 14: Usuario cancela reserva

`DELETE /parking/reserve/{id}`

1. RDS: `status = 'cancelled'`, `cancelled_at = NOW()`.
2. Redis: plaza vuelve a `free`, ajustar contadores.
3. Kafka `reservation.cancelled`.
4. LED vuelve a verde fijo (libre).

---

## 6. Flujos automatizados (EventBridge + Lambda)

---

### Flujo 15: Limpieza automática de reservas expiradas

#### Paso 15.1 — EventBridge dispara Lambda programada

Rule cron `rate(5 minutes)` → Lambda `reservation-cleanup` (Node 24, VPC).

#### Paso 15.2 — Lambda busca reservas expiradas

```sql
SELECT reservation_id, user_id, parking_spot_id
FROM reservations
WHERE status = 'active' AND expires_at < NOW();
```

Para cada fila (ej. `res-expired-001`, `usr-12345`, `spot-03`):

1. **RDS**:

   ```sql
   UPDATE reservations
   SET status = 'expired', expired_at = NOW()
   WHERE reservation_id = 'res-expired-001';
   ```

2. **Redis**:

   ```
   HSET parking:spot:03 status "free"
   DECR parking:stats:total_reserved
   INCR parking:stats:total_available
   ```

3. **RDS audit**:

   ```sql
   INSERT INTO audit_logs (event_type, user_id, parking_spot_id, timestamp)
   VALUES ('reservation_expired', 'usr-12345', 'spot-03', NOW());
   ```

4. **EventBridge** → Lambda `notification-sender` → push: **"Tu reserva de la
   Plaza 03 ha expirado"**.

5. Kafka `reservation.cancelled` con `reason: "expired"`.

6. ESP32 plazas — LED `spot-03` vuelve a verde si FC-51 reporta libre.

---

### Flujo 16: Generación de reporte diario

#### Paso 16.1 — Schedule diario

EventBridge `cron(0 6 * * ? *)` (06:00 UTC) → Lambda `daily-report-generator`.

#### Paso 16.2 — Agregación

Consultas RDS: total ingresos, egresos, ocupación promedio, reservas expiradas,
denegaciones RFID.

Genera CSV/JSON → S3 `polaris-audit-logs-{env}/reports/2025-06-19.json`.

Opcional: SNS/email a administradores.

---

### Flujo 17: Health check de servicios

#### Paso 17.1 — Cada minuto

EventBridge `rate(1 minute)` → Lambda `health-checker`.

Verifica:

- ALB target health (ECS services).
- Conectividad Redis, RDS (query ligera `SELECT 1`).
- Lag consumidor Kafka MSK.
- Last message timestamp IoT Core por `deviceId`.

Si falla → SNS alerta. CloudWatch alarm.

---

### Flujo 18: Auditoría de eventos vehiculares

Kafka `vehicle.entry` / `vehicle.exit` → EventBridge rule → Lambda
`audit-logger`:

1. Log estructurado CloudWatch Logs group `/polaris/audit`.
2. Archivo batch S3 particionado por fecha.
3. Opcional: INSERT RDS `audit_logs` si no se hizo en el servicio origen.

---

### Flujo 19: Agregación de ocupación por zona

Lambda `occupancy-aggregator` (trigger: Kafka `sensor.occupancy` o schedule cada
1 min):

```
HSET parking:zone:a occupied_count 3 total_spots 5
HSET parking:zone:b occupied_count 4 total_spots 5
HSET parking:stats:total_occupied 7
```

Métricas CloudWatch para dashboard admin.

---

## 7. Flujos administrativos

---

### Flujo 20: Admin registra usuario y tarjeta RFID

`POST /admin/users` (API privada, rol admin):

1. Cognito: `AdminCreateUser` + `AdminAddUserToGroup` → grupo `user` (o `admin`).
2. RDS: INSERT `users`, `vehicles`, `rfid_tags`.
3. DynamoDB `RFIDValidations`: `PutItem` con UID de una de las **10 tarjetas**
   disponibles.
4. Audit: `user_created`.

---

### Flujo 21: Admin desactiva usuario

`DELETE /admin/users/{id}`:

1. RDS: soft delete `users.is_active = false`.
2. DynamoDB: `is_active = false` en RFID.
3. Cognito: deshabilitar usuario.
4. Reservas activas → canceladas (misma lógica Flujo 14).

Próximo intento de ingreso → Flujo 3.

---

## 8. Flujos de anomalía y consulta

---

### Flujo 22: Ocupación IR sin ingreso registrado

FC-51 reporta `occupied` en `spot-02` pero Redis/RDS no tienen `vehicle.entry`
reciente para esa plaza.

`event-processor`:

1. CloudWatch alarm `occupancy_without_entry`.
2. Audit `anomaly_unregistered_occupancy`.
3. Admin dashboard marca plaza en **naranja** (estado derivado solo en UI).
4. No abrir barreras — solo alerta operativa.

---

### Flujo 23: Consulta de disponibilidad en tiempo real

`GET /parking/availability` (API pública, cache 30 s):

1. Lee Redis `parking:stats:*` y `parking:spot:*`.
2. Retorna:

   ```json
   {
     "totalSpots": 10,
     "totalAvailable": 4,
     "totalOccupied": 3,
     "totalReserved": 3,
     "spots": [ ... ]
   }
   ```

AppSync subscription mantiene clientes sincronizados sin polling agresivo.

---

## 9. Matriz de flujos

| #   | Flujo                    | Trigger           | Barrera               | Kafka                  |
| --- | ------------------------ | ----------------- | --------------------- | ---------------------- |
| 1   | Ingreso con reserva      | RFID + HC-SR04    | Entrada (ultrasonido) | entry, rfid.validation |
| 2   | Ingreso sin reserva      | RFID              | No abre               | rfid.validation        |
| 3   | RFID inválido entrada    | RFID              | No abre               | rfid.validation        |
| 4   | Proximidad timeout       | HC-SR04           | No abre               | sensor.proximity       |
| 5   | Reserva expirada entrada | RFID              | No abre               | rfid.validation        |
| 6   | Paso estancado entrada   | HC-SR04           | Abierta hasta CLEARED | —                      |
| 7   | Egreso registrado        | RFID salida       | Salida (heurística)   | exit, rfid.validation  |
| 8   | RFID inválido salida     | RFID              | No abre               | rfid.validation        |
| 9   | Egreso sin sesión        | RFID              | No abre               | rfid.validation        |
| 10  | Plaza → ocupada          | FC-51             | —                     | sensor.occupancy       |
| 11  | Plaza → libre            | FC-51             | —                     | sensor.occupancy       |
| 12  | Plaza reservada (LED)    | API reserva       | —                     | reservation.created    |
| 13  | Crear reserva app        | HTTP              | —                     | reservation.created    |
| 14  | Cancelar reserva         | HTTP              | —                     | reservation.cancelled  |
| 15  | Limpiar expiradas        | EventBridge 5 min | —                     | reservation.cancelled  |
| 16  | Reporte diario           | EventBridge cron  | —                     | —                      |
| 17  | Health check             | EventBridge 1 min | —                     | —                      |
| 18  | Audit vehicular          | Kafka             | —                     | audit.events           |
| 19  | Agregar ocupación        | Kafka/schedule    | —                     | —                      |
| 20  | Alta usuario admin       | HTTP admin        | —                     | —                      |
| 21  | Baja usuario admin       | HTTP admin        | —                     | —                      |
| 22  | Anomalía ocupación       | FC-51             | —                     | sensor.occupancy       |
| 23  | Consulta disponibilidad  | HTTP GET          | —                     | —                      |

---

## 10. Referencias

- [`arquitectura.md`](./arquitectura.md) — servicios AWS y topología
- [`roadmap.md`](./roadmap.md) — orden de implementación
- [AWS IoT Core Rules](https://docs.aws.amazon.com/iot/latest/developerguide/iot-rules.html)
- [Amazon MSK](https://docs.aws.amazon.com/msk/latest/developerguide/what-is-msk.html)
- [EventBridge scheduled events](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html)
