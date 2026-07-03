import type { Kafka, Producer, ProducerConfig } from 'kafkajs'

import type { DomainEvent } from '@polaris/domain'
import { domainEventToJson } from '@polaris/domain'
import type { KafkaTopic } from '@polaris/shared-types'

import { createKafka } from '../config/create-kafka.js'

export type { Producer } from 'kafkajs'

export type PublishDomainEventInput = Readonly<{
  topic: KafkaTopic
  event: DomainEvent
  partitionKey?: string
}>

export const createProducer = async (
  kafka: Kafka = createKafka(),
  config: ProducerConfig = {}
): Promise<Producer> => {
  const producer = kafka.producer(config)
  await producer.connect()
  return producer
}

export const disconnectProducer = async (producer: Producer): Promise<void> => {
  await producer.disconnect()
}

export const publishDomainEvent = async (
  producer: Producer,
  input: PublishDomainEventInput
): Promise<void> => {
  const payload = domainEventToJson(input.event)

  await producer.send({
    topic: input.topic,
    messages: [
      {
        key: input.partitionKey ?? input.event.aggregateId,
        value: JSON.stringify(payload)
      }
    ]
  })
}

export const publishJsonMessage = async (
  producer: Producer,
  input: {
    topic: KafkaTopic
    key: string
    value: Record<string, unknown>
  }
): Promise<void> => {
  await producer.send({
    topic: input.topic,
    messages: [
      {
        key: input.key,
        value: JSON.stringify(input.value)
      }
    ]
  })
}
