import { describe, expect, it } from 'vitest'

import {
  buildSpotTransforms,
  carColorForSpot,
  spotTransformById
} from './layout'

describe('buildSpotTransforms', () => {
  const transforms = buildSpotTransforms()

  it('creates 10 spots split in two zones', () => {
    expect(transforms).toHaveLength(10)
    expect(transforms.filter(spot => spot.zone === 'a')).toHaveLength(5)
    expect(transforms.filter(spot => spot.zone === 'b')).toHaveLength(5)
  })

  it('places zone a north (z negative) and zone b south (z positive)', () => {
    for (const transform of transforms) {
      if (transform.zone === 'a') {
        expect(transform.position[2]).toBeLessThan(0)
      } else {
        expect(transform.position[2]).toBeGreaterThan(0)
      }
    }
  })

  it('aligns columns between zones', () => {
    const spot01 = spotTransformById('spot-01')
    const spot06 = spotTransformById('spot-06')

    expect(spot01?.position[0]).toBe(spot06?.position[0])
  })
})

describe('carColorForSpot', () => {
  it('is deterministic per spot', () => {
    expect(carColorForSpot('spot-03')).toBe(carColorForSpot('spot-03'))
    expect(carColorForSpot('spot-01')).not.toBe(carColorForSpot('spot-02'))
  })
})
