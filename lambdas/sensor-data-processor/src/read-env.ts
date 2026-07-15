import { normalizeIotDataEndpoint } from '@polaris/shared-utils'

export type SensorDataProcessorEnv = Readonly<{
  sensorReadingsTableName: string
  sensorReadingsTtlDays: number
  kafkaClientId: string
  ledCommandsEnabled: boolean
  iotDataEndpoint?: string
  redisUrl?: string
}>

export const readSensorDataProcessorEnv = (): SensorDataProcessorEnv => ({
  sensorReadingsTableName:
    process.env.SENSOR_READINGS_TABLE_NAME ?? 'polaris-dev-SensorReadings',
  sensorReadingsTtlDays: Number.parseInt(
    process.env.SENSOR_READINGS_TTL_DAYS ?? '90',
    10
  ),
  kafkaClientId: process.env.KAFKA_CLIENT_ID ?? 'sensor-data-processor',
  ledCommandsEnabled: process.env.LED_COMMANDS_ENABLED !== 'false',
  iotDataEndpoint: process.env.IOT_DATA_ENDPOINT?.trim()
    ? normalizeIotDataEndpoint(process.env.IOT_DATA_ENDPOINT)
    : undefined,
  redisUrl: process.env.REDIS_URL?.trim() || undefined
})
