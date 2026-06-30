import { BadRequestException } from '@nestjs/common'

import {
  parseDateRangeQuery,
  parsePaginationQuery
} from '../common/pagination.validation.js'
import type { AuditLogFilters, AuditLogListQuery } from './audit.types.js'

const readOptionalString = (
  value: string | undefined,
  field: string
): string | undefined => {
  if (value === undefined) {
    return undefined
  }

  const trimmed = value.trim()

  if (trimmed.length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string`)
  }

  return trimmed
}

const readUserType = (
  value: string | undefined
): 'registered' | 'visitor' | undefined => {
  if (value === undefined) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()

  if (normalized !== 'registered' && normalized !== 'visitor') {
    throw new BadRequestException('userType must be registered or visitor')
  }

  return normalized
}

export const parseAuditLogListQuery = (
  query: Record<string, string | undefined>
): AuditLogListQuery => {
  const pagination = parsePaginationQuery(query.page, query.limit)
  const range = parseDateRangeQuery(query.from, query.to)

  const filters: AuditLogFilters = {
    eventType: readOptionalString(query.eventType, 'eventType'),
    userId: readOptionalString(query.userId, 'userId'),
    parkingSpotId: readOptionalString(
      query.parkingSpotId,
      'parkingSpotId'
    )?.toLowerCase(),
    gate: readOptionalString(query.gate, 'gate'),
    userType: readUserType(query.userType),
    from: range.from,
    to: range.to
  }

  return {
    ...pagination,
    ...filters
  }
}
