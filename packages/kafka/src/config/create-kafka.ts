import { Kafka, type KafkaConfig } from 'kafkajs'

import { loadLocalEnv } from '@polaris/shared-utils'

import { readKafkaEnv } from './kafka-env.js'

export const createKafkaConfig = (): KafkaConfig => {
  loadLocalEnv(import.meta.url)
  const env = readKafkaEnv()

  return {
    clientId: env.clientId,
    brokers: env.brokers
  }
}

export const createKafka = (overrides: Partial<KafkaConfig> = {}): Kafka =>
  new Kafka({ ...createKafkaConfig(), ...overrides })
