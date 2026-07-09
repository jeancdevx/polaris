import { describe, expect, it } from 'vitest'

import { InitialSchema1740350000000 } from '../migrations/1740350000000-InitialSchema.js'
import { ParkingSessions1740350000001 } from '../migrations/1740350000001-ParkingSessions.js'

import { createDataSourceOptions } from './create-data-source.js'

describe('createDataSourceOptions', () => {
  it('registers all database migrations', () => {
    const options = createDataSourceOptions()

    expect(options.migrations).toEqual([
      InitialSchema1740350000000,
      ParkingSessions1740350000001
    ])
  })
})
