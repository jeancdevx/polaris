import type { EntryProximityIoTEvent } from './entry-proximity-iot-event.js'
import { KafkaProximityPublisher } from './publishers/kafka-proximity.publisher.js'
import type { SensorDataProcessorEnv } from './read-env.js'

export type EntryProximityProcessorResponse = Readonly<{
  deviceId: string
  event: EntryProximityIoTEvent['event']
  kafkaPublished: boolean
  timestamp: string
}>

export type ProcessEntryProximityDependencies = Readonly<{
  env: SensorDataProcessorEnv
  kafkaPublisher: KafkaProximityPublisher
}>

export const createProcessEntryProximityDependencies = (
  env: SensorDataProcessorEnv
): ProcessEntryProximityDependencies => ({
  env,
  kafkaPublisher: new KafkaProximityPublisher(env.kafkaClientId)
})

export const processEntryProximityTelemetry = async (
  telemetry: EntryProximityIoTEvent,
  deps: ProcessEntryProximityDependencies
): Promise<EntryProximityProcessorResponse> => {
  await deps.kafkaPublisher.publishEntryProximityTelemetry(telemetry)

  return {
    deviceId: telemetry.deviceId,
    event: telemetry.event,
    kafkaPublished: true,
    timestamp: telemetry.occurredAt.toISOString()
  }
}
