import { describe, expect, it } from 'vitest'

import {
  buildAuditLogStreamName,
  buildS3ObjectKey,
  parseIncomingAuditEvent
} from './audit-record.js'

describe('parseIncomingAuditEvent', () => {
  it('parses EventBridge vehicle entry events', () => {
    const record = parseIncomingAuditEvent({
      version: '0',
      id: 'evt-123',
      source: 'polaris.event-processor',
      'detail-type': 'vehicle.entry',
      time: '2025-06-19T14:05:00.000Z',
      detail: {
        eventName: 'vehicle.entry',
        aggregateId: 'evt-entry-001',
        occurredAt: '2025-06-19T14:05:00.000Z',
        parkingSpotId: 'spot-03',
        previousStatus: 'reserved',
        currentStatus: 'occupied',
        userId: 'usr-12345'
      }
    })

    expect(record.eventType).toBe('vehicle.entry')
    expect(record.aggregateId).toBe('evt-entry-001')
    expect(record.source).toBe('polaris.event-processor')
    expect(record.payload.parkingSpotId).toBe('spot-03')
  })

  it('parses Kafka audit.events payloads', () => {
    const record = parseIncomingAuditEvent({
      eventName: 'audit.events',
      aggregateId: 'A3:BF:22:01',
      occurredAt: '2025-06-19T14:00:00.000Z',
      eventType: 'entry_denied',
      rfidUid: 'A3:BF:22:01',
      gate: 'entry',
      reason: 'no_active_reservation'
    })

    expect(record.eventType).toBe('entry_denied')
    expect(record.source).toBe('polaris.kafka')
  })
})

describe('audit archive paths', () => {
  it('builds date-partitioned S3 keys', () => {
    const occurredAt = '2025-06-19T14:05:00.000Z'

    expect(
      buildS3ObjectKey('audit', {
        eventType: 'vehicle.entry',
        aggregateId: 'evt-entry-001',
        occurredAt,
        source: 'polaris.event-processor',
        payload: {}
      })
    ).toBe(
      `audit/year=2025/month=06/day=19/${new Date(occurredAt).getTime()}-evt-entry-001.json`
    )
  })

  it('builds daily CloudWatch log stream names', () => {
    expect(buildAuditLogStreamName('2025-06-19T14:05:00.000Z')).toBe(
      'audit-2025-06-19'
    )
  })
})
