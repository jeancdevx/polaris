import { describe, expect, it } from 'vitest'

import { ledModeForStatus } from './led-mode.js'

describe('ledModeForStatus', () => {
  it('maps parking spot status to LED modes', () => {
    expect(ledModeForStatus('free')).toBe('free')
    expect(ledModeForStatus('occupied')).toBe('occupied')
    expect(ledModeForStatus('reserved')).toBe('blink_blue')
  })
})
