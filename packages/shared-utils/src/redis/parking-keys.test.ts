import { describe, expect, it } from 'vitest'

import {
  PARKING_STATS_KEYS,
  parkingLockKey,
  parkingSpotKey,
  spotIdFromParkingSpotKey
} from './parking-keys.js'

describe('parking-keys', () => {
  it('uses hash tag so multi-key ops share one cluster slot', () => {
    const spot = parkingSpotKey('spot-03')
    expect(spot).toBe('{parking}:spot:spot-03')
    expect(PARKING_STATS_KEYS.totalReserved).toBe(
      '{parking}:stats:total_reserved'
    )
    expect(parkingLockKey('spot-03')).toBe('{parking}:lock:spot-03')
  })

  it('extracts spot id from key', () => {
    expect(spotIdFromParkingSpotKey('{parking}:spot:spot-07')).toBe('spot-07')
  })
})
