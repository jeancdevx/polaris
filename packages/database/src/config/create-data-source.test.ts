import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { InitialSchema1740350000000 } from '../migrations/1740350000000-InitialSchema.js'
import { ParkingSessions1740350000001 } from '../migrations/1740350000001-ParkingSessions.js'
import { ReliableEvents1740350000002 } from '../migrations/1740350000002-ReliableEvents.js'

import { createDataSourceOptions } from './create-data-source.js'

const originalEnv = { ...process.env }

describe('createDataSourceOptions', () => {
  beforeEach(() => {
    process.env.DATABASE_URL =
      'postgresql://user:pass@localhost:5432/parking_db'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('registers all database migrations', () => {
    const options = createDataSourceOptions()

    expect(options.migrations).toEqual([
      InitialSchema1740350000000,
      ParkingSessions1740350000001,
      ReliableEvents1740350000002
    ])
  })
})
