import { describe, expect, it, vi } from 'vitest'

import { ParkingService } from './parking.service.js'
import type { RdsAvailabilityReader } from './rds-availability.reader.js'
import type { RedisAvailabilityReader } from './redis-availability.reader.js'

const sampleStatus = {
  totalSpots: 10,
  totalAvailable: 10,
  totalOccupied: 0,
  totalReserved: 0,
  totalVisitors: 0,
  spots: [],
  updatedAt: '2025-06-19T10:00:00.000Z'
}

const createParkingService = (): {
  parkingService: ParkingService
  redisAvailabilityReader: RedisAvailabilityReader
  rdsAvailabilityReader: RdsAvailabilityReader
} => {
  const redisAvailabilityReader = {
    tryGetAvailability: vi.fn()
  } as unknown as RedisAvailabilityReader

  const rdsAvailabilityReader = {
    getAvailability: vi.fn()
  } as unknown as RdsAvailabilityReader

  return {
    parkingService: new ParkingService(
      redisAvailabilityReader,
      rdsAvailabilityReader
    ),
    redisAvailabilityReader,
    rdsAvailabilityReader
  }
}

describe('ParkingService', () => {
  it('returns Redis data when cache is warm', async () => {
    const { parkingService, redisAvailabilityReader, rdsAvailabilityReader } =
      createParkingService()

    vi.mocked(redisAvailabilityReader.tryGetAvailability).mockResolvedValue(
      sampleStatus
    )

    await expect(parkingService.getAvailability()).resolves.toEqual(
      sampleStatus
    )
    expect(rdsAvailabilityReader.getAvailability).not.toHaveBeenCalled()
  })

  it('falls back to RDS when Redis cache is cold', async () => {
    const { parkingService, redisAvailabilityReader, rdsAvailabilityReader } =
      createParkingService()

    vi.mocked(redisAvailabilityReader.tryGetAvailability).mockResolvedValue(
      null
    )
    vi.mocked(rdsAvailabilityReader.getAvailability).mockResolvedValue(
      sampleStatus
    )

    await expect(parkingService.getAvailability()).resolves.toEqual(
      sampleStatus
    )
  })
})
