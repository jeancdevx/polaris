import { describe, expect, it } from 'vitest'

import type { PolarisRedisClient } from './connect-redis.js'
import { scanRedisKeyBatches } from './scan-redis-keys.js'

describe('scanRedisKeyBatches', () => {
  it('scans standalone clients with scanIterator', async () => {
    const batches = [
      ['parking:spot:01', 'parking:spot:02'],
      ['parking:spot:03']
    ]

    const client = {
      async *scanIterator() {
        for (const batch of batches) {
          yield batch
        }
      }
    }

    const keys: string[] = []

    for await (const batch of scanRedisKeyBatches(
      client as PolarisRedisClient,
      {
        match: 'parking:spot:*'
      }
    )) {
      keys.push(...batch)
    }

    expect(keys).toEqual([
      'parking:spot:01',
      'parking:spot:02',
      'parking:spot:03'
    ])
  })

  it('scans each cluster master node', async () => {
    const client = {
      masters: [{ id: 'master-1' }, { id: 'master-2' }],
      async nodeClient(master: { id: string }) {
        return {
          async *scanIterator() {
            if (master.id === 'master-1') {
              yield ['parking:spot:01']
            } else {
              yield ['parking:spot:02']
            }
          }
        }
      }
    }

    const keys: string[] = []

    for await (const batch of scanRedisKeyBatches(
      client as PolarisRedisClient,
      {
        match: 'parking:spot:*'
      }
    )) {
      keys.push(...batch)
    }

    expect(keys).toEqual(['parking:spot:01', 'parking:spot:02'])
  })
})
