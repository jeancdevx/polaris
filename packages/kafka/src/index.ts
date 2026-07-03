export {
  readKafkaEnv,
  type KafkaAuthMode,
  type KafkaEnv
} from './config/kafka-env.js'
export { createKafka, createKafkaConfig } from './config/create-kafka.js'
export { loadLocalEnv } from '@polaris/shared-utils'

export {
  runKafkaSmokeTest,
  type KafkaSmokeTestOptions,
  type KafkaSmokeTestResult
} from './smoke/run-kafka-smoke-test.js'

export {
  kafkaMessageError,
  isKafkaMessageError,
  type KafkaMessageError
} from './errors/kafka-message-error.js'

export {
  createConsumer,
  disconnectConsumer,
  parseKafkaMessage,
  runConsumer,
  type KafkaMessageContext,
  type KafkaMessageHandler
} from './consumer/create-consumer.js'

export {
  createProducer,
  disconnectProducer,
  publishDomainEvent,
  publishJsonMessage,
  type Producer,
  type PublishDomainEventInput
} from './producer/create-producer.js'

export {
  parseAuditEvent,
  parseJsonValue,
  parseKafkaEnvelope,
  parseKafkaEventByTopic,
  parseOccupancyChangedEvent,
  parseProximityDetectedEvent,
  parseReservationCancelledEvent,
  parseReservationCreatedEvent,
  parseRfidValidationEvent,
  parseVehicleEntryEvent,
  parseVehicleExitEvent,
  type AuditEvent,
  type KafkaEventEnvelope,
  type OccupancyChangedEvent,
  type ParsedKafkaEvent,
  type ProximityDetectedEvent,
  type ReservationCancelledEvent,
  type ReservationCreatedEvent,
  type RfidValidationEvent,
  type VehicleEntryEvent,
  type VehicleExitEvent
} from './schemas/index.js'
