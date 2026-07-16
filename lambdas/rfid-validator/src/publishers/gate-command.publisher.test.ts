import { describe, expect, it } from 'vitest'

import type { RfidScanEvent } from '../iot-event.js'
import { gateCommandId } from './gate-command.publisher.js'

const scan: RfidScanEvent = {
  deviceId: 'entry-io-01',
  rfidUid: 'A3:BF:22:01',
  readerLocation: 'entry',
  occurredAt: new Date('2026-07-15T20:00:00.000Z')
}

describe('gateCommandId', () => {
  it('is stable across retries of the same scan', () => {
    expect(gateCommandId(scan)).toBe(gateCommandId({ ...scan }))
    expect(gateCommandId(scan)).toBe(
      'rfid:entry-io-01:entry:A3:BF:22:01:1784145600000'
    )
  })

  it('changes when the logical scan changes', () => {
    expect(
      gateCommandId({
        ...scan,
        readerLocation: 'exit'
      })
    ).not.toBe(gateCommandId(scan))
  })
})
