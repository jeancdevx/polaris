import { describe, expect, it } from 'vitest'

import { parseLedSyncRequestIoTEvent } from './led-sync-iot-event.js'

describe('parseLedSyncRequestIoTEvent', () => {
  it('parses the payload published by leds_zone_a/b firmware', () => {
    const parsed = parseLedSyncRequestIoTEvent({
      deviceId: 'leds-zone-b',
      event: 'led_sync_request',
      spotFirst: 6,
      spotLast: 10,
      timestamp: 1_752_123_456_789
    })

    expect(parsed.deviceId).toBe('leds-zone-b')
    expect(parsed.spotFirst).toBe(6)
    expect(parsed.spotLast).toBe(10)
  })
})
