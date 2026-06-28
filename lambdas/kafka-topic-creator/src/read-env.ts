export type KafkaTopicCreatorEnv = {
  bootstrapBrokers: string[]
  numPartitions: number
  replicationFactor: number
  minInsyncReplicas: number
  region: string
}

const readRequired = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const readPositiveInt = (name: string): number => {
  const value = Number.parseInt(readRequired(name), 10)

  if (!Number.isFinite(value) || value < 1) {
    throw new Error(`Environment variable ${name} must be a positive integer`)
  }

  return value
}

export const readKafkaTopicCreatorEnv = (): KafkaTopicCreatorEnv => ({
  bootstrapBrokers: readRequired('KAFKA_BOOTSTRAP_BROKERS')
    .split(',')
    .map(broker => broker.trim())
    .filter(Boolean),
  numPartitions: readPositiveInt('KAFKA_NUM_PARTITIONS'),
  replicationFactor: readPositiveInt('KAFKA_REPLICATION_FACTOR'),
  minInsyncReplicas: readPositiveInt('KAFKA_MIN_INSYNC_REPLICAS'),
  region: readRequired('AWS_REGION')
})
