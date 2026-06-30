import { describe, expect, it } from 'vitest'

import { parseRfidScanEvent } from './iot-event.js'

describe('parseRfidScanEvent', () => {
  it('parses a direct IoT payload', () => {
    const scan = parseRfidScanEvent({
      deviceId: 'entry-gate-01',
      event: 'rfid_scan',
      rfid_uid: 'A3:BF:22:01',
      reader_location: 'entry',
      timestamp: 1_717_000_005_000
    })

    expect(scan.deviceId).toBe('entry-gate-01')
    expect(scan.rfidUid).toBe('A3:BF:22:01')
    expect(scan.readerLocation).toBe('entry')
    expect(scan.occurredAt.getTime()).toBe(1_717_000_005_000)
  })

  it('unwraps nested IoT rule payloads', () => {
    const scan = parseRfidScanEvent({
      payload: {
        deviceId: 'exit-gate-01',
        rfidUid: 'A3:BF:22:01',
        readerLocation: 'exit',
        timestamp: '2025-06-19T10:00:00.000Z'
      }
    })

    expect(scan.readerLocation).toBe('exit')
  })
})
