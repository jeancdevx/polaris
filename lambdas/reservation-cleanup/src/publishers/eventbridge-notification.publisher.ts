import type { ReservationRow } from '@polaris/database'
import {
  createEventBridgeClient,
  publishEventBridgeEntry,
  readEventBridgeEnv
} from '@polaris/eventbridge'
import { KAFKA_TOPICS } from '@polaris/shared-types'

import type { ReservationCleanupEnv } from '../read-env.js'

export class EventBridgeNotificationPublisher {
  private readonly client

  constructor(private readonly env: ReservationCleanupEnv) {
    const baseEnv = readEventBridgeEnv()

    this.client = createEventBridgeClient({
      ...baseEnv,
      busName: env.eventBridgeBusName,
      source: env.eventBridgeSource
    })
  }

  async publishExpired(row: ReservationRow): Promise<void> {
    await publishEventBridgeEntry(this.client, {
      source: this.env.eventBridgeSource,
      detailType: KAFKA_TOPICS.RESERVATION_CANCELLED,
      busName: this.env.eventBridgeBusName,
      detail: {
        reservationId: row.reservationId,
        userId: row.userId,
        parkingSpotId: row.parkingSpotId,
        reason: 'expired',
        occurredAt: (row.expiredAt ?? new Date()).toISOString()
      }
    })
  }
}
