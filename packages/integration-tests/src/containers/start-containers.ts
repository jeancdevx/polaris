import {
  KafkaContainer,
  type StartedKafkaContainer
} from '@testcontainers/kafka'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer
} from '@testcontainers/postgresql'
import {
  RedisContainer,
  type StartedRedisContainer
} from '@testcontainers/redis'

export type IntegrationContainers = Readonly<{
  postgres: StartedPostgreSqlContainer
  redis: StartedRedisContainer
  kafka: StartedKafkaContainer
}>

export const startIntegrationContainers =
  async (): Promise<IntegrationContainers> => {
    const [postgres, redis, kafka] = await Promise.all([
      new PostgreSqlContainer('postgres:17.10-alpine')
        .withDatabase('parking_db')
        .withUsername('parking_admin')
        .withPassword('parking_dev')
        .start(),
      new RedisContainer('redis:8.6.4-alpine').start(),
      new KafkaContainer('confluentinc/cp-kafka:7.6.1').withKraft().start()
    ])

    return { postgres, redis, kafka }
  }

const kafkaBrokerAddress = (kafka: StartedKafkaContainer): string =>
  `${kafka.getHost()}:${kafka.getMappedPort(9093)}`

export const applyIntegrationEnv = (
  containers: IntegrationContainers
): void => {
  process.env.DATABASE_URL = containers.postgres.getConnectionUri()
  process.env.REDIS_URL = containers.redis.getConnectionUrl()
  process.env.KAFKA_BROKERS = kafkaBrokerAddress(containers.kafka)
  process.env.KAFKA_CLIENT_ID = 'polaris-integration-test'
  process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1'
}

export const stopIntegrationContainers = async (
  containers: IntegrationContainers
): Promise<void> => {
  await Promise.all([
    containers.postgres.stop(),
    containers.redis.stop(),
    containers.kafka.stop()
  ])
}
