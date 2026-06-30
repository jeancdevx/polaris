import { BadRequestException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'

import { parseAuditLogListQuery } from './audit-query.validation.js'

describe('audit-query.validation', () => {
  it('parses audit filters and pagination', () => {
    expect(
      parseAuditLogListQuery({
        page: '2',
        limit: '10',
        eventType: 'vehicle.entry',
        userId: 'usr-12345',
        parkingSpotId: 'SPOT-03',
        gate: 'entry',
        userType: 'registered'
      })
    ).toMatchObject({
      page: 2,
      limit: 10,
      eventType: 'vehicle.entry',
      userId: 'usr-12345',
      parkingSpotId: 'spot-03',
      gate: 'entry',
      userType: 'registered'
    })
  })

  it('rejects invalid userType', () => {
    expect(() => parseAuditLogListQuery({ userType: 'invalid' })).toThrow(
      BadRequestException
    )
  })
})
