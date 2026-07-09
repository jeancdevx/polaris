import { describe, expect, it } from 'vitest'

import { parseOccupancyChangedIoTEvent } from './iot-event.js'

describe('parseOccupancyChangedIoTEvent', () => {
  it('parses a direct IoT occupancy payload', () => {
    const reading = parseOccupancyChangedIoTEvent({
      deviceId: 'actuators-01',
      spotId: 'spot-05',
      event: 'occupancy_changed',
      status: 'occupied',
      sensorType: 'fc-51',
      timestamp: 1_717_001_000_000
    })

    expect(reading.deviceId).toBe('actuators-01')
    expect(reading.spotId).toBe('spot-05')
    expect(reading.status).toBe('occupied')
    expect(reading.sensorType).toBe('fc-51')
    expect(reading.occurredAt.getTime()).toBe(1_717_001_000_000)
  })

  it('unwraps nested IoT rule payloads', () => {
    const reading = parseOccupancyChangedIoTEvent({
      payload: {
        deviceId: 'actuators-01',
        spotId: 'spot-07',
        status: 'free',
        sensor_type: 'fc-51',
        timestamp: '2025-06-19T15:10:00.000Z'
      }
    })

    expect(reading.status).toBe('free')
    expect(reading.spotId).toBe('spot-07')
  })

  it('rejects reserved status from devices', () => {
    expect(() =>
      parseOccupancyChangedIoTEvent({
        deviceId: 'actuators-01',
        spotId: 'spot-01',
        status: 'reserved',
        sensorType: 'fc-51',
        timestamp: Date.now()
      })
    ).toThrow('status must be free or occupied')
  })
})
