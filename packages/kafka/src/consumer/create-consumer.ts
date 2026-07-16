import type {
  Consumer,
  ConsumerConfig,
  EachMessagePayload,
  Kafka
} from 'kafkajs'

import type { KafkaTopic } from '@polaris/shared-types'

import {
  isKafkaMessageError,
  type KafkaMessageError
} from '../errors/kafka-message-error.js'

import { parseJsonValue } from '../schemas/envelope.js'
import {
  parseKafkaEventByTopic,
  type ParsedKafkaEvent
} from '../schemas/index.js'

import { createKafka } from '../config/create-kafka.js'

export type KafkaMessageContext = Readonly<{
  topic: KafkaTopic
  partition: number
  offset: string
  key: string | null
  timestamp: string
}>

export type KafkaMessageHandler = (
  event: ParsedKafkaEvent,
  context: KafkaMessageContext
) => Promise<void> | void

export type MalformedMessagePolicy = 'retry' | 'skip' | 'dead-letter'

export type KafkaConsumerRunOptions = Readonly<{
  malformedMessagePolicy?: MalformedMessagePolicy
  onMalformedMessage?: (
    error: KafkaMessageError,
    context: KafkaMessageContext,
    rawValue: Buffer | null
  ) => Promise<void> | void
}>

export const createConsumer = async (
  groupId: string,
  kafka: Kafka = createKafka(),
  config: Omit<ConsumerConfig, 'groupId'> = {}
): Promise<Consumer> => {
  const consumer = kafka.consumer({ groupId, ...config })
  await consumer.connect()
  return consumer
}

export const disconnectConsumer = async (consumer: Consumer): Promise<void> => {
  await consumer.disconnect()
}

export const parseKafkaMessage = (
  topic: KafkaTopic,
  value: Buffer | null
): ParsedKafkaEvent => {
  if (!value) {
    throw new Error(`Empty Kafka message on topic ${topic}`)
  }

  const raw = parseJsonValue(value.toString('utf8'))
  return parseKafkaEventByTopic(topic, raw)
}

export const runConsumer = async (
  consumer: Consumer,
  topics: KafkaTopic[],
  handler: KafkaMessageHandler,
  options: KafkaConsumerRunOptions = {}
): Promise<void> => {
  await consumer.subscribe({ topics, fromBeginning: false })

  await consumer.run({
    eachMessage: async (payload: EachMessagePayload) => {
      const topic = payload.topic as KafkaTopic
      const context: KafkaMessageContext = {
        topic,
        partition: payload.partition,
        offset: payload.message.offset,
        key: payload.message.key?.toString('utf8') ?? null,
        timestamp: payload.message.timestamp
      }

      let event: ParsedKafkaEvent
      try {
        event = parseKafkaMessage(topic, payload.message.value)
      } catch (error) {
        if (!isKafkaMessageError(error)) throw error
        const policy = options.malformedMessagePolicy ?? 'retry'
        if (policy === 'retry') throw error
        if (policy === 'dead-letter' && !options.onMalformedMessage) {
          throw new Error('dead-letter policy requires onMalformedMessage', {
            cause: error
          })
        }
        await options.onMalformedMessage?.(
          error,
          context,
          payload.message.value
        )
        return
      }

      // Handler failures are deliberately not caught: KafkaJS retries the
      // message and does not commit its offset.
      await handler(event, context)
    }
  })
}
