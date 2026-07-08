import { Injectable } from '@nestjs/common'

import type { ParkingSpot } from '@polaris/domain'
import type { ParkingSpotStatus } from '@polaris/shared-types'
import type { PolarisRedisClient } from '@polaris/shared-utils'

import {
  PARKING_STATS_KEYS,
  parkingSpotKey
} from '../infrastructure/parking.constants.js'
import { RedisService } from '../infrastructure/redis.service.js'

export type StatDelta = Readonly<{
  available: number
  occupied: number
  reserved: number
}>

export const statDeltaForTransition = (
  from: ParkingSpotStatus,
  to: ParkingSpotStatus
): StatDelta => {
  if (from === to) {
    return { available: 0, occupied: 0, reserved: 0 }
  }

  const decrement: StatDelta = {
    available: from === 'free' ? -1 : 0,
    occupied: from === 'occupied' ? -1 : 0,
    reserved: from === 'reserved' ? -1 : 0
  }

  const increment: StatDelta = {
    available: to === 'free' ? 1 : 0,
    occupied: to === 'occupied' ? 1 : 0,
    reserved: to === 'reserved' ? 1 : 0
  }

  return {
    available: decrement.available + increment.available,
    occupied: decrement.occupied + increment.occupied,
    reserved: decrement.reserved + increment.reserved
  }
}

@Injectable()
export class ParkingRedisStore {
  constructor(private readonly redisService: RedisService) {}

  async syncSpotTransition(
    spot: ParkingSpot,
    previousStatus: ParkingSpotStatus
  ): Promise<void> {
    const client = await this.redisService.getClient()
    const delta = statDeltaForTransition(previousStatus, spot.status)
    const spotKey = parkingSpotKey(spot.spotId.value)

    const multi = client.multi()

    if (spot.status === 'free') {
      multi.hSet(spotKey, { status: 'free' })
      multi.hDel(spotKey, ['userId', 'reservationId', 'occupiedSince'])
    } else {
      const hash: Record<string, string> = { status: spot.status }

      if (spot.userId) {
        hash.userId = spot.userId.value
      }

      if (spot.reservationId) {
        hash.reservationId = spot.reservationId.value
      }

      if (spot.occupiedSince) {
        hash.occupiedSince = String(spot.occupiedSince.getTime())
      }

      multi.hSet(spotKey, hash)
    }

    applyStatDelta(multi, delta)
    await multi.exec()
  }
}

const applyStatDelta = (
  multi: ReturnType<PolarisRedisClient['multi']>,
  delta: StatDelta
): void => {
  if (delta.available !== 0) {
    multi.incrBy(PARKING_STATS_KEYS.totalAvailable, delta.available)
  }

  if (delta.occupied !== 0) {
    multi.incrBy(PARKING_STATS_KEYS.totalOccupied, delta.occupied)
  }

  if (delta.reserved !== 0) {
    multi.incrBy(PARKING_STATS_KEYS.totalReserved, delta.reserved)
  }
}
