import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'

import type { RfidTagRow } from '@polaris/database'
import {
  createRfidUid,
  createUserId,
  createVehiclePlate,
  isRfidTagValid,
  restoreRfidTag,
  type RfidTag
} from '@polaris/domain'

import { getLambdaDataSource } from '../database/lambda-data-source.js'

import type { RfidLookupMode } from '../read-env.js'

export type RfidLookupResult = Readonly<{
  tag: RfidTag
  source: 'dynamodb' | 'rds'
}>

type RfidLookupRepositoryOptions = Readonly<{
  lookupMode: RfidLookupMode
  tableName?: string
  dynamoClient?: DynamoDBDocumentClient
  /** Test seam — production checks the RDS users table. */
  userExists?: (userId: string) => Promise<boolean>
}>

const mapDynamoItemToTag = (item: Record<string, unknown>): RfidTag | null => {
  const rfidUid = item.rfid_uid ?? item.rfidUid
  const userId = item.user_id ?? item.userId

  if (typeof rfidUid !== 'string' || typeof userId !== 'string') {
    return null
  }

  const vehiclePlate =
    typeof item.vehicle_plate === 'string'
      ? item.vehicle_plate
      : typeof item.vehiclePlate === 'string'
        ? item.vehiclePlate
        : 'UNK-0000'

  const userType =
    item.user_type === 'visitor' || item.userType === 'visitor'
      ? 'visitor'
      : 'registered'

  const isActive =
    item.is_active === true ||
    item.isActive === true ||
    item.is_active === 'true'

  const validUntilRaw = item.valid_until ?? item.validUntil
  const validUntil =
    typeof validUntilRaw === 'string' ? new Date(validUntilRaw) : undefined

  return restoreRfidTag({
    rfidUid: createRfidUid(rfidUid),
    userId: createUserId(userId),
    userType,
    vehiclePlate: createVehiclePlate(vehiclePlate),
    isActive,
    validUntil,
    createdAt: new Date()
  })
}

const mapRfidTagRow = (row: RfidTagRow): RfidTag =>
  restoreRfidTag({
    rfidUid: createRfidUid(row.rfidUid),
    userId: createUserId(row.userId),
    userType: row.userType,
    vehiclePlate: createVehiclePlate(row.vehiclePlate),
    isActive: row.isActive,
    validUntil: row.validUntil,
    createdAt: row.createdAt
  })

export class RfidLookupRepository {
  private readonly dynamo?: DynamoDBDocumentClient

  constructor(private readonly options: RfidLookupRepositoryOptions) {
    if (options.lookupMode !== 'rds') {
      this.dynamo = options.dynamoClient ?? createDefaultDynamoClient()
    }
  }

  async findByUid(rfidUid: string): Promise<RfidLookupResult | null> {
    if (this.options.lookupMode === 'rds') {
      return this.findInRds(rfidUid)
    }

    const dynamoTag = await this.findInDynamo(rfidUid)

    if (dynamoTag) {
      // An explicit DynamoDB record is authoritative when valid.
      // Never fall back to RDS when Dynamo says inactive/expired.
      if (!isRfidTagValid(dynamoTag)) {
        return null
      }

      // After DB reset/reseed, Dynamo can still point at a Cognito user_id
      // that no longer exists in RDS — using it breaks parking_sessions FK.
      if (await this.userExistsInRds(dynamoTag.userId.value)) {
        return { tag: dynamoTag, source: 'dynamodb' }
      }

      const rdsFallback = await this.findInRds(rfidUid)
      if (rdsFallback) {
        return rdsFallback
      }

      return null
    }

    if (this.options.lookupMode === 'dynamodb') {
      return null
    }

    return this.findInRds(rfidUid)
  }

  private async userExistsInRds(userId: string): Promise<boolean> {
    if (this.options.userExists) {
      return this.options.userExists(userId)
    }

    const dataSource = await getLambdaDataSource()
    const count = await dataSource.getRepository('User').count({
      where: { userId }
    })
    return count > 0
  }

  private async findInDynamo(rfidUid: string): Promise<RfidTag | null> {
    if (!this.options.tableName || !this.dynamo) {
      return null
    }

    const response = await this.dynamo.send(
      new GetCommand({
        TableName: this.options.tableName,
        Key: { rfid_uid: rfidUid }
      })
    )

    if (!response.Item) {
      return null
    }

    return mapDynamoItemToTag(response.Item)
  }

  private async findInRds(rfidUid: string): Promise<RfidLookupResult | null> {
    const dataSource = await getLambdaDataSource()
    const row = await dataSource
      .getRepository<RfidTagRow>('RfidTag')
      .findOne({ where: { rfidUid } })

    if (!row) {
      return null
    }

    const tag = mapRfidTagRow(row)

    if (!isRfidTagValid(tag)) {
      return null
    }

    return { tag, source: 'rds' }
  }
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
