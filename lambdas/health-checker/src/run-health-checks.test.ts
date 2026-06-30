import { describe, expect, it } from 'vitest'

import { SnsAlertPublisher } from './sns-alert.publisher.js'

describe('SnsAlertPublisher', () => {
  it('skips SNS when alerts are disabled', async () => {
    const publisher = new SnsAlertPublisher({
      redisUrl: 'redis://localhost:6379',
      alertsEnabled: false
    })

    const sent = await publisher.publishFailures([
      { name: 'redis', healthy: false, detail: 'timeout' }
    ])

    expect(sent).toBe(false)
  })
})
