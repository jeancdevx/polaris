import type { Handler } from 'aws-lambda'

import { instrumentLambdaHandler } from '@polaris/lambda-core'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import { ensureTopics } from './ensure-topics.js'
import { readKafkaTopicCreatorEnv } from './read-env.js'

export type KafkaTopicCreatorResponse = {
  created: string[]
  existing: string[]
  total: number
}

const createTopics = async (): Promise<KafkaTopicCreatorResponse> => {
  const env = readKafkaTopicCreatorEnv()
  const topics = Object.values(KAFKA_TOPICS)
  const result = await ensureTopics(topics, env)

  return {
    ...result,
    total: topics.length
  }
}

export const handler: Handler<unknown, KafkaTopicCreatorResponse> =
  instrumentLambdaHandler(
    { serviceName: 'kafka-topic-creator' },
    async (_event, _context, logger) => {
      const result = await createTopics()

      logger.info('Kafka topics ensured', {
        created: result.created,
        existing: result.existing,
        total: result.total
      })

      return result
    }
  )
