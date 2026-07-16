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

type StartedIntegrationContainer =
  | StartedPostgreSqlContainer
  | StartedRedisContainer
  | StartedKafkaContainer

const stopAll = async (
  containers: readonly StartedIntegrationContainer[]
): Promise<void> => {
  const results = await Promise.allSettled(
    containers.map(container => container.stop())
  )
  const failures = results
    .filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    )
    .map(result => result.reason)

  if (failures.length > 0) {
    throw new AggregateError(failures, 'Failed to stop integration containers')
  }
}

export const startIntegrationContainers =
  async (): Promise<IntegrationContainers> => {
    const results = await Promise.allSettled([
      new PostgreSqlContainer('postgres:17.10-alpine')
        .withDatabase('parking_db')
        .withUsername('parking_admin')
        .withPassword('parking_dev')
        .start(),
      new RedisContainer('redis:8.6.4-alpine').start(),
      new KafkaContainer('confluentinc/cp-kafka:7.6.1').withKraft().start()
    ])

    const failures = results
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected'
      )
      .map(result => result.reason)

    if (failures.length > 0) {
      const started = results
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<StartedIntegrationContainer> =>
            result.status === 'fulfilled'
        )
        .map(result => result.value)

      try {
        await stopAll(started)
      } catch (cleanupError) {
        failures.push(cleanupError)
      }

      throw new AggregateError(
        failures,
        'Failed to start integration containers'
      )
    }

    const [postgresResult, redisResult, kafkaResult] = results as [
      PromiseFulfilledResult<StartedPostgreSqlContainer>,
      PromiseFulfilledResult<StartedRedisContainer>,
      PromiseFulfilledResult<StartedKafkaContainer>
    ]

    return {
      postgres: postgresResult.value,
      redis: redisResult.value,
      kafka: kafkaResult.value
    }
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
  containers: IntegrationContainers | undefined
): Promise<void> => {
  if (!containers) {
    return
  }

  await stopAll([containers.postgres, containers.redis, containers.kafka])
}
