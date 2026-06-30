import { describe, expect, it } from 'vitest'

import { statDeltaForTransition } from './parking-redis.store.js'

describe('parking redis stat transitions', () => {
  it('moves a reserved spot to occupied', () => {
    expect(statDeltaForTransition('reserved', 'occupied')).toEqual({
      available: 0,
      occupied: 1,
      reserved: -1
    })
  })

  it('moves an occupied spot to free', () => {
    expect(statDeltaForTransition('occupied', 'free')).toEqual({
      available: 1,
      occupied: -1,
      reserved: 0
    })
  })

  it('moves a free spot to occupied', () => {
    expect(statDeltaForTransition('free', 'occupied')).toEqual({
      available: -1,
      occupied: 1,
      reserved: 0
    })
  })
})
