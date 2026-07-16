import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getLambdaDataSource } from '../database/lambda-data-source.js'

import { RfidLookupRepository } from './rfid-lookup.repository.js'

vi.mock('../database/lambda-data-source.js', () => ({
  getLambdaDataSource: vi.fn()
}))

const createDynamo = (item: Record<string, unknown>): DynamoDBDocumentClient =>
  ({
    send: vi.fn().mockResolvedValue({ Item: item })
  }) as unknown as DynamoDBDocumentClient

describe('RfidLookupRepository', () => {
  beforeEach(() => {
    vi.mocked(getLambdaDataSource).mockReset()
  })

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
      }),
      userExists: async () => true
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
      }),
      userExists: async () => true
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
      }),
      userExists: async () => true
    })

    await expect(repository.findByUid('A1:B2:C3:D4')).resolves.toMatchObject({
      source: 'dynamodb',
      tag: { isActive: true }
    })
  })

  it('falls back to RDS when DynamoDB user_id is missing after reset', async () => {
    vi.mocked(getLambdaDataSource).mockResolvedValue({
      getRepository: () => ({
        findOne: vi.fn().mockResolvedValue({
          rfidUid: 'A2:C8:F3:F0',
          userId: 'usr-card03',
          userType: 'visitor',
          vehiclePlate: 'VIS-030',
          isActive: true,
          validUntil: null,
          createdAt: new Date('2025-06-19T10:00:00.000Z')
        })
      })
    } as never)

    const repository = new RfidLookupRepository({
      lookupMode: 'dynamodb_with_rds_fallback',
      tableName: 'rfid',
      dynamoClient: createDynamo({
        rfid_uid: 'A2:C8:F3:F0',
        user_id: 'usr-a63a7b7b81a9533d',
        vehicle_plate: 'XYZ-123',
        user_type: 'registered',
        is_active: true
      }),
      userExists: async () => false
    })

    await expect(repository.findByUid('A2:C8:F3:F0')).resolves.toMatchObject({
      source: 'rds',
      tag: {
        userId: { value: 'usr-card03' },
        vehiclePlate: { value: 'VIS-030' }
      }
    })
  })
})
