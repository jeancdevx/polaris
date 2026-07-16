import { describe, expect, it, vi } from 'vitest'

import type { LedSyncRequestIoTEvent } from './led-sync-iot-event.js'
import {
  processLedSyncRequest,
  type ProcessLedSyncDependencies
} from './process-led-sync.js'

const request: LedSyncRequestIoTEvent = {
  deviceId: 'leds-zone-a',
  spotFirst: 1,
  spotLast: 2,
  occurredAt: new Date('2026-07-16T12:00:00.000Z')
}

describe('processLedSyncRequest', () => {
  it('publishes LED modes from RDS statuses', async () => {
    const publishSpotMode = vi.fn(async () => true)
    const deps: ProcessLedSyncDependencies = {
      env: {
        sensorReadingsTableName: 'SensorReadings',
        sensorReadingsTtlDays: 90,
        kafkaClientId: 'sensor-data-processor',
        ledCommandsEnabled: true,
        iotDataEndpoint: 'example-ats.iot.us-east-2.amazonaws.com',
        redisUrl: 'redis://localhost:6379'
      },
      ledPublisher: { publishSpotMode } as never,
      parkingSpotStatus: {
        listStatusesInRange: vi.fn(async () => [
          { spotId: 'spot-01', status: 'occupied' },
          { spotId: 'spot-02', status: 'reserved' }
        ])
      } as never
    }

    const result = await processLedSyncRequest(request, deps)

    expect(result.ledCommandsPublished).toBe(2)
    expect(publishSpotMode).toHaveBeenNthCalledWith(1, 'spot-01', 'occupied')
    expect(publishSpotMode).toHaveBeenNthCalledWith(2, 'spot-02', 'blink_blue')
  })

  it('falls back to Redis when RDS is unavailable', async () => {
    const publishSpotMode = vi.fn(async () => true)
    const deps: ProcessLedSyncDependencies = {
      env: {
        sensorReadingsTableName: 'SensorReadings',
        sensorReadingsTtlDays: 90,
        kafkaClientId: 'sensor-data-processor',
        ledCommandsEnabled: true,
        iotDataEndpoint: 'example-ats.iot.us-east-2.amazonaws.com',
        redisUrl: 'redis://localhost:6379'
      },
      ledPublisher: { publishSpotMode } as never,
      parkingSpotStatus: {
        listStatusesInRange: vi.fn(async () => {
          throw new Error('RDS unavailable')
        })
      } as never
    }

    const redisModule = await import('@polaris/shared-utils')
    const connectRedis = vi
      .spyOn(redisModule, 'connectRedis')
      .mockResolvedValue({
        hGet: vi.fn(async (_key: string, field: string) =>
          field === 'status' ? 'free' : null
        )
      } as never)
    const disconnectRedis = vi
      .spyOn(redisModule, 'disconnectRedis')
      .mockResolvedValue(undefined)

    const result = await processLedSyncRequest(request, deps)

    expect(result.ledCommandsPublished).toBe(2)
    expect(connectRedis).toHaveBeenCalledOnce()
    expect(disconnectRedis).toHaveBeenCalledOnce()
    expect(publishSpotMode).toHaveBeenCalledWith('spot-01', 'free')
  })
})
