import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { describe, expect, it, vi } from 'vitest'

import { RfidLookupRepository } from './rfid-lookup.repository.js'

const createDynamo = (item: Record<string, unknown>): DynamoDBDocumentClient =>
  ({
    send: vi.fn().mockResolvedValue({ Item: item })
  }) as unknown as DynamoDBDocumentClient

describe('RfidLookupRepository', () => {
  it('rejects an explicitly inactive DynamoDB credential', async () => {
    const repository = new RfidLookupRepository({
      lookupMode: 'dynamodb_with_rds_fallback',
      tableName: 'rfid',
      dynamoClient: createDynamo({
        rfid_uid: 'A1:B2:C3:D4',
        user_id: 'usr-12345',
        vehicle_plate: 'ABC-1234',
        user_type: 'registered',
        is_active: false
      })
    })

    await expect(repository.findByUid('A1:B2:C3:D4')).resolves.toBeNull()
  })

  it('rejects an expired DynamoDB credential', async () => {
    const repository = new RfidLookupRepository({
      lookupMode: 'dynamodb_with_rds_fallback',
      tableName: 'rfid',
      dynamoClient: createDynamo({
        rfid_uid: 'A1:B2:C3:D4',
        user_id: 'usr-12345',
        vehicle_plate: 'ABC-1234',
        user_type: 'visitor',
        is_active: true,
        valid_until: '2020-01-01T00:00:00.000Z'
      })
    })

    await expect(repository.findByUid('A1:B2:C3:D4')).resolves.toBeNull()
  })

  it('returns a currently valid DynamoDB credential', async () => {
    const repository = new RfidLookupRepository({
      lookupMode: 'dynamodb',
      tableName: 'rfid',
      dynamoClient: createDynamo({
        rfid_uid: 'A1:B2:C3:D4',
        user_id: 'usr-12345',
        vehicle_plate: 'ABC-1234',
        user_type: 'registered',
        is_active: true
      })
    })

    await expect(repository.findByUid('A1:B2:C3:D4')).resolves.toMatchObject({
      source: 'dynamodb',
      tag: { isActive: true }
    })
  })
})
