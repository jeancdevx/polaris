import { ServiceUnavailableException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HealthController } from './health.controller.js'

describe('HealthController', () => {
  const getHealthState = vi.fn()
  let controller: HealthController

  beforeEach(() => {
    getHealthState.mockReturnValue({
      ready: true,
      groupJoined: true,
      stoppedUnexpectedly: false,
      lastProcessedAt: '2026-07-15T12:00:00.000Z'
    })
    controller = new HealthController({ getHealthState } as never)
  })

  it('reports Kafka consumer state and recent processing', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'event-processor-service',
      kafka: {
        groupJoined: true,
        lastProcessedAt: '2026-07-15T12:00:00.000Z'
      }
    })
  })

  it('returns readiness while the Kafka consumer is healthy', () => {
    expect(controller.getReadiness()).toEqual(controller.getHealth())
  })

  it('rejects readiness before the consumer joins its group', () => {
    getHealthState.mockReturnValue({
      ready: false,
      groupJoined: false,
      stoppedUnexpectedly: false,
      lastProcessedAt: null
    })

    expect(() => controller.getReadiness()).toThrow(ServiceUnavailableException)
  })

  it('rejects readiness after the consumer stops unexpectedly', () => {
    getHealthState.mockReturnValue({
      ready: false,
      groupJoined: false,
      stoppedUnexpectedly: true,
      lastProcessedAt: '2026-07-15T12:00:00.000Z'
    })

    expect(() => controller.getReadiness()).toThrow(ServiceUnavailableException)
  })
})
