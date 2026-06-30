import { BadRequestException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'

import {
  buildPaginatedResponse,
  parseDateRangeQuery,
  parsePaginationQuery
} from './pagination.validation.js'

describe('pagination.validation', () => {
  it('parses pagination defaults', () => {
    expect(parsePaginationQuery(undefined, undefined)).toEqual({
      page: 1,
      limit: 20
    })
  })

  it('rejects invalid date ranges', () => {
    expect(() =>
      parseDateRangeQuery(
        '2025-06-20T00:00:00.000Z',
        '2025-06-19T00:00:00.000Z'
      )
    ).toThrow(BadRequestException)
  })

  it('builds total pages', () => {
    expect(
      buildPaginatedResponse({
        items: [1, 2],
        total: 25,
        page: 1,
        limit: 10
      }).totalPages
    ).toBe(3)
  })
})
