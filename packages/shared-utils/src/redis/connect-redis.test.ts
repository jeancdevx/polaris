import { describe, expect, it } from 'vitest'

import { isRedisClusterUrl } from './connect-redis.js'

describe('isRedisClusterUrl', () => {
  it('detects ElastiCache cluster configuration endpoints', () => {
    expect(
      isRedisClusterUrl(
        'rediss://:secret@polaris-prod-redis.clustercfg.us-east-2.cache.amazonaws.com:6379'
      )
    ).toBe(true)
  })

  it('treats standalone Redis URLs as non-cluster', () => {
    expect(isRedisClusterUrl('redis://localhost:6379')).toBe(false)
    expect(
      isRedisClusterUrl(
        'rediss://polaris-prod-redis-0001-001.polaris-prod-redis.tdu2yq.use2.cache.amazonaws.com:6379'
      )
    ).toBe(false)
  })
})
