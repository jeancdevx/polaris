import { describe, expect, it, vi } from 'vitest'

import {
  clampFreeSpots,
  recountAndSetParkingStats
} from './recount-parking-stats.js'

describe('clampFreeSpots', () => {
  it('clamps to 0..10', () => {
    expect(clampFreeSpots(11)).toBe(10)
    expect(clampFreeSpots(-1)).toBe(0)
    expect(clampFreeSpots(7.9)).toBe(7)
    expect(clampFreeSpots(Number.NaN)).toBe(0)
  })
})

describe('recountAndSetParkingStats', () => {
  it('rewrites counters from spot hashes', async () => {
    const statuses: Record<string, string> = {
      '{parking}:spot:spot-01': 'free',
      '{parking}:spot:spot-02': 'occupied',
      '{parking}:spot:spot-03': 'reserved'
    }

    for (let n = 4; n <= 10; ++n) {
      const id = `spot-${String(n).padStart(2, '0')}`
      statuses[`{parking}:spot:${id}`] = 'free'
    }

    const set = vi.fn().mockReturnThis()
    const exec = vi.fn().mockResolvedValue([])
    const multi = vi.fn(() => ({ set, exec }))

    const redis = {
      hGet: vi.fn(async (key: string) => statuses[key] ?? 'free'),
      multi
    }

    const result = await recountAndSetParkingStats(redis as never)

    expect(result).toEqual({
      totalAvailable: 8,
      totalOccupied: 1,
      totalReserved: 1
    })
    expect(multi).toHaveBeenCalledOnce()
    expect(set).toHaveBeenCalledWith('{parking}:stats:total_available', 8)
  })
})
