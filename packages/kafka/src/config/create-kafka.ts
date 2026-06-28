import { generateAuthToken } from 'aws-msk-iam-sasl-signer-js'
import { Kafka, type KafkaConfig } from 'kafkajs'

import { readKafkaEnv } from './kafka-env.js'

export const createKafkaConfig = (): KafkaConfig => {
  const env = readKafkaEnv()

  if (env.authMode === 'iam') {
    return {
      clientId: env.clientId,
      brokers: env.brokers,
      ssl: true,
      connectionTimeout: 10_000,
      requestTimeout: 30_000,
      sasl: {
        mechanism: 'oauthbearer',
        oauthBearerProvider: async () => {
          const authToken = await generateAuthToken({ region: env.region })

          return { value: authToken.token }
        }
      }
    }
  }

  return {
    clientId: env.clientId,
    brokers: env.brokers
  }
}

export const createKafka = (overrides: Partial<KafkaConfig> = {}): Kafka =>
  new Kafka({ ...createKafkaConfig(), ...overrides })
