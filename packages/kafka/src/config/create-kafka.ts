import { Kafka, type KafkaConfig } from 'kafkajs'

import { readKafkaEnv } from './kafka-env.js'
import { loadEnv } from './load-env.js'

export const createKafkaConfig = (): KafkaConfig => {
  loadEnv()
  const env = readKafkaEnv()

  return {
    clientId: env.clientId,
    brokers: env.brokers
  }
}

export const createKafka = (overrides: Partial<KafkaConfig> = {}): Kafka =>
  new Kafka({ ...createKafkaConfig(), ...overrides })
