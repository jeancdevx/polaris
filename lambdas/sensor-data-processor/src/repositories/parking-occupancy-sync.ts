import type { ParkingSpotStatus } from '@polaris/shared-types'
import {
  clampFreeSpots,
  connectRedis,
  disconnectRedis,
  PARKING_STATS_KEYS,
  parkingSpotKey,
  recountAndSetParkingStats
} from '@polaris/shared-utils'

import { getLambdaDataSource } from '../database/lambda-data-source.js'

export type OccupancySyncResult = Readonly<{
  previousStatus: ParkingSpotStatus
  currentStatus: ParkingSpotStatus
  freeSpots: number
  changed: boolean
}>

const asStatus = (value: string | undefined): ParkingSpotStatus => {
  if (value === 'occupied' || value === 'reserved') {
    return value
  }
  return 'free'
}

export class ParkingOccupancySync {
  async applySensorOccupancy(
    spotId: string,
    nextStatus: ParkingSpotStatus,
    redisUrl: string | undefined,
    occurredAt: Date
  ): Promise<OccupancySyncResult> {
    let previousStatus: ParkingSpotStatus = 'free'
    let changed = false
    let preservedReserved = false

    // Authoritative RDS update (best-effort if DB env is configured).
    try {
      const dataSource = await getLambdaDataSource()
      await dataSource.transaction(async manager => {
        const repo = manager.getRepository('ParkingSpot')
        const row = await repo.findOne({ where: { spotId } })
        if (!row) {
          return
        }
        previousStatus = asStatus(
          typeof row.status === 'string' ? row.status : undefined
        )
        if (previousStatus === nextStatus) {
          return
        }
        // Keep active reservations when the bay is empty.
        if (previousStatus === 'reserved' && nextStatus === 'free') {
          preservedReserved = true
          return
        }
        changed = true
        await repo.update(
          { spotId },
          {
            status: nextStatus,
            occupiedSince: nextStatus === 'occupied' ? occurredAt : null,
            ...(nextStatus === 'free'
              ? { userId: null, reservationId: null }
              : {})
          }
        )
      })
    } catch {
      // Fall through to Redis-only path.
    }

    let freeSpots = 0
    let currentStatus: ParkingSpotStatus = preservedReserved
      ? 'reserved'
      : nextStatus

    if (redisUrl) {
      const redis = await connectRedis(redisUrl)
      try {
        const spotKey = parkingSpotKey(spotId)
        const current = asStatus(
          (await redis.hGet(spotKey, 'status')) ?? undefined
        )
        if (!changed) {
          previousStatus = current
        }

        if (current === 'reserved' && nextStatus === 'free') {
          currentStatus = 'reserved'
        } else if (current !== nextStatus) {
          changed = true
          currentStatus = nextStatus
          const multi = redis.multi()
          if (nextStatus === 'free') {
            multi.hSet(spotKey, { status: 'free' })
            multi.hDel(spotKey, ['userId', 'reservationId', 'occupiedSince'])
          } else {
            const hash: Record<string, string> = { status: nextStatus }
            if (nextStatus === 'occupied') {
              hash.occupiedSince = String(occurredAt.getTime())
            }
            multi.hSet(spotKey, hash)
          }

          if (current === 'free') {
            multi.decr(PARKING_STATS_KEYS.totalAvailable)
          } else if (current === 'occupied') {
            multi.decr(PARKING_STATS_KEYS.totalOccupied)
          } else if (current === 'reserved') {
            multi.decr(PARKING_STATS_KEYS.totalReserved)
          }

          if (nextStatus === 'free') {
            multi.incr(PARKING_STATS_KEYS.totalAvailable)
          } else if (nextStatus === 'occupied') {
            multi.incr(PARKING_STATS_KEYS.totalOccupied)
          } else if (nextStatus === 'reserved') {
            multi.incr(PARKING_STATS_KEYS.totalReserved)
          }

          await multi.exec()
        } else {
          currentStatus = current
        }

        // incr/decr drifts under dual writers (lambda + event-processor);
        // always republish from a recount of spot hashes.
        const recounted = await recountAndSetParkingStats(redis)
        freeSpots = clampFreeSpots(recounted.totalAvailable)
      } finally {
        await disconnectRedis(redis)
      }
    }

    return {
      previousStatus,
      currentStatus,
      freeSpots,
      changed
    }
  }
}
