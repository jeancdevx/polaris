import { describe, expect, it } from 'vitest'

import type { ParkingSpotRow } from '../entities/index.js'

import { parkingRedisHashForRow } from './sync-parking-redis.js'

describe('parkingRedisHashForRow', () => {
  it('omits stale ownership fields for an RDS-free spot', () => {
    const row: ParkingSpotRow = {
      spotId: 'A-001',
      zone: 'A',
      status: 'free',
      updatedAt: new Date()
    }

    expect(parkingRedisHashForRow(row)).toEqual({ status: 'free' })
  })

  it('projects reservation ownership from RDS', () => {
    const row: ParkingSpotRow = {
      spotId: 'A-001',
      zone: 'A',
      status: 'reserved',
      reservationId: 'res-001',
      userId: 'usr-001',
      updatedAt: new Date()
    }

    expect(parkingRedisHashForRow(row)).toEqual({
      status: 'reserved',
      reservationId: 'res-001',
      userId: 'usr-001'
    })
  })
})
