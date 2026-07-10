import { describe, expect, it } from 'vitest'

import { detectSensorIoTEventKind } from './route-sensor-iot-event.js'

describe('detectSensorIoTEventKind', () => {
  it('detects LED sync requests from zone ESP32 firmware', () => {
    expect(
      detectSensorIoTEventKind({
        deviceId: 'leds-zone-b',
        event: 'led_sync_request',
        spotFirst: 6,
        spotLast: 10,
        timestamp: 1_752_123_456_789
      })
    ).toBe('led_sync')
  })

  it('detects FC-51 occupancy telemetry', () => {
    expect(
      detectSensorIoTEventKind({
        deviceId: 'actuators-01',
        spotId: 'spot-04',
        event: 'occupancy_changed',
        status: 'occupied',
        sensorType: 'fc-51',
        timestamp: 1_752_123_456_789
      })
    ).toBe('occupancy')
  })

  it('detects HC-SR04 entry proximity telemetry', () => {
    expect(
      detectSensorIoTEventKind({
        deviceId: 'entry-io-01',
        event: 'proximity_detected',
        distance_cm: 18,
        timestamp: 1_752_123_456_789
      })
    ).toBe('entry_proximity')
  })

  it('rejects unknown IoT payloads with a clear error', () => {
    expect(() =>
      detectSensorIoTEventKind({
        deviceId: 'entry-io-01',
        event: 'totally_unknown_event'
      })
    ).toThrow(/Unsupported sensor-data-processor IoT event/)
  })
})
