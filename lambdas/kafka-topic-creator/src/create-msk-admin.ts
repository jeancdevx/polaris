import { generateAuthToken } from 'aws-msk-iam-sasl-signer-js'
import { Kafka, type Admin } from 'kafkajs'

import type { KafkaTopicCreatorEnv } from './read-env.js'

export const createMskAdmin = (env: KafkaTopicCreatorEnv): Admin => {
  const kafka = new Kafka({
    clientId: 'polaris-kafka-topic-creator',
    brokers: env.bootstrapBrokers,
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
  })

  return kafka.admin()
}
