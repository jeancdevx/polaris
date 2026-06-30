export type RfidLookupMode = 'dynamodb' | 'rds' | 'dynamodb_with_rds_fallback'

export type RfidValidatorEnv = Readonly<{
  lookupMode: RfidLookupMode
  rfidValidationsTableName?: string
  gateCommandsEnabled: boolean
  iotDataEndpoint?: string
  entryDisplayDeviceId: string
  entryServoDeviceId: string
  exitServoDeviceId: string
  kafkaClientId: string
}>

const readLookupMode = (): RfidLookupMode => {
  const raw = process.env.RFID_LOOKUP_MODE?.trim().toLowerCase()

  if (raw === 'rds') {
    return 'rds'
  }

  if (raw === 'dynamodb') {
    return 'dynamodb'
  }

  return 'dynamodb_with_rds_fallback'
}

export const readRfidValidatorEnv = (): RfidValidatorEnv => ({
  lookupMode: readLookupMode(),
  rfidValidationsTableName: process.env.RFID_VALIDATIONS_TABLE_NAME,
  gateCommandsEnabled: process.env.GATE_COMMANDS_ENABLED === 'true',
  iotDataEndpoint: process.env.IOT_DATA_ENDPOINT,
  entryDisplayDeviceId: process.env.ENTRY_DISPLAY_DEVICE_ID ?? 'entry-lcd',
  entryServoDeviceId: process.env.ENTRY_SERVO_DEVICE_ID ?? 'entry-servo',
  exitServoDeviceId: process.env.EXIT_SERVO_DEVICE_ID ?? 'exit-servo',
  kafkaClientId: process.env.KAFKA_CLIENT_ID ?? 'rfid-validator'
})
