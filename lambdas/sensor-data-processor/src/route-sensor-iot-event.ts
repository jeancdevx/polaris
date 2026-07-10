const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const unwrapPayload = (raw: unknown): Record<string, unknown> => {
  if (!isRecord(raw)) {
    throw new Error('IoT event must be an object')
  }

  if (isRecord(raw.payload)) {
    return raw.payload
  }

  return raw
}

const readString = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export type SensorIoTEventKind = 'occupancy' | 'led_sync' | 'entry_proximity'

const entryProximityEvents = new Set([
  'proximity_detected',
  'proximity_timeout',
  'passage_in_progress',
  'passage_stalled',
  'exit_barrier_timeout'
])

export const detectSensorIoTEventKind = (raw: unknown): SensorIoTEventKind => {
  const record = unwrapPayload(raw)
  const event = readString(record, 'event')

  if (event === 'led_sync_request') {
    return 'led_sync'
  }

  if (
    event !== undefined &&
    entryProximityEvents.has(event) &&
    readString(record, 'deviceId') !== undefined
  ) {
    return 'entry_proximity'
  }

  if (
    readString(record, 'spotId') !== undefined &&
    readString(record, 'deviceId') !== undefined &&
    (record.sensorType === 'fc-51' || record.sensor_type === 'fc-51')
  ) {
    return 'occupancy'
  }

  throw new Error(
    `Unsupported sensor-data-processor IoT event (event=${event ?? 'missing'})`
  )
}
