import { describe, expect, it } from 'vitest'

import { parseMetricsListQuery } from './metrics-query.validation.js'

describe('metrics-query.validation', () => {
  it('defaults to a 24h range when dates are omitted', () => {
    const query = parseMetricsListQuery({})

    expect(query.zone).toBeUndefined()
    expect(query.to.getTime()).toBeGreaterThan(query.from.getTime())
  })

  it('parses zone and explicit range', () => {
    const query = parseMetricsListQuery({
      zone: 'B',
      from: '2025-06-19T00:00:00.000Z',
      to: '2025-06-19T23:59:59.999Z'
    })

    expect(query.zone).toBe('b')
    expect(query.from.toISOString()).toBe('2025-06-19T00:00:00.000Z')
  })
})
