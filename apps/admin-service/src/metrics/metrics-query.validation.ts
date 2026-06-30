import { BadRequestException } from '@nestjs/common'

import { parseDateRangeQuery } from '../common/pagination.validation.js'
import { defaultMetricsRange, type MetricsListQuery } from './metrics.types.js'

const readZone = (value: string | undefined): 'a' | 'b' | undefined => {
  if (value === undefined) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()

  if (normalized !== 'a' && normalized !== 'b') {
    throw new BadRequestException('zone must be a or b')
  }

  return normalized
}

export const parseMetricsListQuery = (
  query: Record<string, string | undefined>
): MetricsListQuery => {
  const parsedRange = parseDateRangeQuery(query.from, query.to)
  const fallback = defaultMetricsRange()

  const from = parsedRange.from ?? fallback.from!
  const to = parsedRange.to ?? fallback.to!

  return {
    zone: readZone(query.zone),
    from,
    to
  }
}
