import { describe, expect, it, vi } from 'vitest'

import {
  formatTimestamp,
  generateId,
  isValidEmail,
  isValidRfidUid,
  isValidVehiclePlate,
  parseTimestamp,
  retry,
  sleep
} from './index.js'

describe('shared-utils', () => {
  it('generateId prefixes values', () => {
    expect(generateId('res')).toMatch(/^res-[a-z0-9]+-[a-f0-9]{8}$/)
  })

  it('formats and parses timestamps', () => {
    const date = new Date('2025-06-19T10:00:00.000Z')
    expect(formatTimestamp(date)).toBe('2025-06-19T10:00:00.000Z')
    expect(parseTimestamp('2025-06-19T10:00:00.000Z').toISOString()).toBe(
      '2025-06-19T10:00:00.000Z'
    )
  })

  it('validates email, plate and rfid formats', () => {
    expect(isValidEmail('juan@example.com')).toBe(true)
    expect(isValidEmail('bad')).toBe(false)
    expect(isValidVehiclePlate('abc-123')).toBe(true)
    expect(isValidVehiclePlate('INVALID')).toBe(false)
    expect(isValidRfidUid('A3:BF:22:01')).toBe(true)
    expect(isValidRfidUid('bad')).toBe(false)
  })

  it('retries until success', async () => {
    vi.useFakeTimers()
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok')

    const promise = retry(fn, 3, 100)
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('sleep resolves after delay', async () => {
    vi.useFakeTimers()
    const promise = sleep(50)
    await vi.advanceTimersByTimeAsync(50)
    await expect(promise).resolves.toBeUndefined()
    vi.useRealTimers()
  })
})
