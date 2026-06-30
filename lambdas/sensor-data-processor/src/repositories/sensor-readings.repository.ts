import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

import type { OccupancyChangedIoTEvent } from '../iot-event.js'

export type SensorReadingRecord = Readonly<{
  sensorId: string
  timestamp: string
  deviceId: string
  spotId: string
  status: string
  sensorType: string
  event: 'occupancy_changed'
  expiresAt?: number
}>

type SensorReadingsRepositoryOptions = Readonly<{
  tableName: string
  ttlDays: number
  dynamoClient?: DynamoDBDocumentClient
}>

export class SensorReadingsRepository {
  private readonly dynamo: DynamoDBDocumentClient

  constructor(private readonly options: SensorReadingsRepositoryOptions) {
    this.dynamo = options.dynamoClient ?? createDefaultDynamoClient()
  }

  async saveOccupancyReading(
    reading: OccupancyChangedIoTEvent
  ): Promise<SensorReadingRecord> {
    const timestamp = reading.occurredAt.toISOString()
    const record: SensorReadingRecord = {
      sensorId: reading.spotId,
      timestamp,
      deviceId: reading.deviceId,
      spotId: reading.spotId,
      status: reading.status,
      sensorType: reading.sensorType,
      event: 'occupancy_changed',
      expiresAt: buildExpiresAt(this.options.ttlDays)
    }

    await this.dynamo.send(
      new PutCommand({
        TableName: this.options.tableName,
        Item: record
      })
    )

    return record
  }
}

const buildExpiresAt = (ttlDays: number): number | undefined => {
  if (ttlDays <= 0) {
    return undefined
  }

  return Math.floor(Date.now() / 1000) + ttlDays * 86_400
}

const createDefaultDynamoClient = (): DynamoDBDocumentClient => {
  const config: ConstructorParameters<typeof DynamoDBClient>[0] = {
    region:
      process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1'
  }

  if (process.env.AWS_ENDPOINT_URL) {
    config.endpoint = process.env.AWS_ENDPOINT_URL
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test'
    }
  }

  return DynamoDBDocumentClient.from(new DynamoDBClient(config))
}
