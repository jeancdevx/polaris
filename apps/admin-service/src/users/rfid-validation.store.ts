import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { UserType } from '@polaris/shared-types'

import { USERS_CONFIG_KEY, type UsersConfig } from './users.config.js'

export type RfidValidationRecord = Readonly<{
  rfidUid: string
  userId: string
  userType: UserType
  vehiclePlate: string
  isActive: boolean
}>

@Injectable()
export class RfidValidationStore {
  private readonly config: UsersConfig
  private readonly client: DynamoDBDocumentClient

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<UsersConfig>(USERS_CONFIG_KEY)
    this.client = createDynamoClient(this.config.awsRegion)
  }

  async putActiveRecord(record: RfidValidationRecord): Promise<void> {
    const tableName = this.config.rfidValidationsTableName
    if (!tableName) {
      return
    }

    await this.client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          rfid_uid: record.rfidUid,
          user_id: record.userId,
          user_type: record.userType,
          vehicle_plate: record.vehiclePlate,
          is_active: record.isActive
        }
      })
    )
  }

  async setActive(rfidUid: string, isActive: boolean): Promise<void> {
    const tableName = this.config.rfidValidationsTableName
    if (!tableName) {
      return
    }

    await this.client.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { rfid_uid: rfidUid },
        UpdateExpression: 'SET is_active = :isActive',
        ExpressionAttributeValues: {
          ':isActive': isActive
        }
      })
    )
  }
}

const createDynamoClient = (region: string): DynamoDBDocumentClient => {
  const config: ConstructorParameters<typeof DynamoDBClient>[0] = { region }

  if (process.env.AWS_ENDPOINT_URL) {
    config.endpoint = process.env.AWS_ENDPOINT_URL
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test'
    }
  }

  return DynamoDBDocumentClient.from(new DynamoDBClient(config))
}
