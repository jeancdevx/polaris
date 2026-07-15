import { describe, expect, it } from 'vitest'

import {
  buildOccupancyChangedInput,
  parseOccupancyPublisherEvent
} from './occupancy-event.js'

describe('parseOccupancyPublisherEvent', () => {
  it('parses sensor.occupancy EventBridge events', () => {
    const event = parseOccupancyPublisherEvent({
      source: 'polaris.event-processor',
      'detail-type': 'sensor.occupancy',
      detail: {
        parkingSpotId: 'spot-03',
        previousStatus: 'free',
        currentStatus: 'occupied',
        occurredAt: '2025-06-19T14:05:00.000Z',
        deviceId: 'sensor-001',
        sensorType: 'ultrasonic'
      }
    })

    expect(event).toEqual({
      detailType: 'sensor.occupancy',
      source: 'polaris.event-processor',
      parkingSpotId: 'spot-03',
      previousStatus: 'free',
      currentStatus: 'occupied',
      occurredAt: '2025-06-19T14:05:00.000Z',
      deviceId: 'sensor-001',
      sensorType: 'ultrasonic'
    })
  })

  it('parses vehicle.entry with explicit status fields', () => {
    const event = parseOccupancyPublisherEvent({
      source: 'polaris.event-processor',
      'detail-type': 'vehicle.entry',
      detail: {
        parkingSpotId: 'spot-01',
        previousStatus: 'reserved',
        currentStatus: 'occupied',
        occurredAt: '2025-06-19T14:05:00.000Z'
      }
    })

    expect(event.previousStatus).toBe('reserved')
    expect(event.currentStatus).toBe('occupied')
    expect(event.detailType).toBe('vehicle.entry')
  })

  it('infers reservation.created status when fields are missing', () => {
    const event = parseOccupancyPublisherEvent({
      source: 'polaris.event-processor',
      'detail-type': 'reservation.created',
      detail: {
        parkingSpotId: 'spot-02',
        reservationId: 'res-001',
        occurredAt: '2025-06-19T14:05:00.000Z'
      }
    })

    expect(event.previousStatus).toBe('free')
    expect(event.currentStatus).toBe('reserved')
  })

  it('infers reservation.cancelled and vehicle.exit transitions', () => {
    expect(
      parseOccupancyPublisherEvent({
        source: 'polaris.event-processor',
        'detail-type': 'reservation.cancelled',
        detail: { parkingSpotId: 'spot-02' }
      }).currentStatus
    ).toBe('free')

    expect(
      parseOccupancyPublisherEvent({
        source: 'polaris.event-processor',
        'detail-type': 'vehicle.exit',
        detail: { parkingSpotId: 'spot-02' }
      }).currentStatus
    ).toBe('free')
  })

  it('rejects unsupported detail types', () => {
    expect(() =>
      parseOccupancyPublisherEvent({
        source: 'polaris.event-processor',
        'detail-type': 'rfid.scan',
        detail: {
          parkingSpotId: 'spot-01',
          previousStatus: 'free',
          currentStatus: 'occupied'
        }
      })
    ).toThrow('Unsupported detail-type')
  })
})

describe('buildOccupancyChangedInput', () => {
  it('derives zone a for spots 1-5', () => {
    const input = buildOccupancyChangedInput({
      detailType: 'sensor.occupancy',
      source: 'polaris.event-processor',
      parkingSpotId: 'spot-03',
      previousStatus: 'free',
      currentStatus: 'occupied',
      occurredAt: '2025-06-19T14:05:00.000Z'
    })

    expect(input.zone).toBe('a')
    expect(input.spotId).toBe('spot-03')
  })

  it('derives zone b for spots 6+', () => {
    const input = buildOccupancyChangedInput({
      detailType: 'sensor.occupancy',
      source: 'polaris.event-processor',
      parkingSpotId: 'spot-08',
      previousStatus: 'occupied',
      currentStatus: 'free',
      occurredAt: '2025-06-19T14:05:00.000Z'
    })

    expect(input.zone).toBe('b')
  })
})
