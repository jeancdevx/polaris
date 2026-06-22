# Stack local de desarrollo

| Servicio      | Imagen                          | Puerto(s)        | Uso                                 |
| ------------- | ------------------------------- | ---------------- | ----------------------------------- |
| PostgreSQL    | `postgres:17.10-alpine`         | 5432             | Aurora (datos transaccionales)      |
| Redis         | `redis:8.6.4-alpine`            | 6379             | ElastiCache (estado en tiempo real) |
| Kafka (KRaft) | `apache/kafka:4.3.1-rc2`        | 9092, 9094, 9096 | 3 brokers — emula Amazon MSK        |
| Kafka UI      | `provectuslabs/kafka-ui:v0.7.2` | 8080             | Inspección de topics y mensajes     |

## Kafka — clúster local (3 brokers KRaft)

| Broker | Contenedor        | Puerto host | Rol                 |
| ------ | ----------------- | ----------- | ------------------- |
| 1      | `polaris-kafka-1` | `9092`      | broker + controller |
| 2      | `polaris-kafka-2` | `9094`      | broker + controller |
| 3      | `polaris-kafka-3` | `9096`      | broker + controller |

- **Modo:** KRaft (sin ZooKeeper), `CLUSTER_ID` compartido.
- **Topics:** 3 particiones, replication-factor 3, `min.insync.replicas=2`.
- **Listeners:** `PLAINTEXT` (29092, red Docker) + `PLAINTEXT_HOST` (acceso
  desde el host).

## Uso

```bash
docker compose -f infra/local/docker-compose.yml up -d
docker compose -f infra/local/docker-compose.yml ps
docker compose -f infra/local/docker-compose.yml down
```

- **Kafka UI:** http://localhost:8080
- Los topics se crean al iniciar (`kafka-init`), nombres alineados con
  `@polaris/shared-types` → `KAFKA_TOPICS`.

Verificar el clúster:

```bash
docker compose -f infra/local/docker-compose.yml exec kafka-1 \
  /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:29092,kafka-2:29092,kafka-3:29092 \
  --describe
```

## Variables (`.env.local`)

Copiar desde `.env.example`:

```env
DATABASE_URL=postgresql://parking_admin:parking_dev@localhost:5432/parking_db
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092,localhost:9094,localhost:9096
AWS_REGION=us-east-2
```
