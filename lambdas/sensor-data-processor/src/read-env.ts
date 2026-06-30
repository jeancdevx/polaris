export type SensorDataProcessorEnv = Readonly<{
  sensorReadingsTableName: string
  sensorReadingsTtlDays: number
  kafkaClientId: string
}>

export const readSensorDataProcessorEnv = (): SensorDataProcessorEnv => ({
  sensorReadingsTableName:
    process.env.SENSOR_READINGS_TABLE_NAME ?? 'polaris-dev-SensorReadings',
  sensorReadingsTtlDays: Number.parseInt(
    process.env.SENSOR_READINGS_TTL_DAYS ?? '90',
    10
  ),
  kafkaClientId: process.env.KAFKA_CLIENT_ID ?? 'sensor-data-processor'
})
